import { db } from '../db';
import type { FieldReport, ReportAttachment, TaskCategory, TaskPriority } from '../types';
import { networkSimulator } from './networkSimulator';
import { taskScheduler } from './taskScheduler';
import { syncManager } from './syncManager';

export interface CreateReportInput {
  title: string;
  description: string;
  category: TaskCategory;
  severity: TaskPriority;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string;
  notes?: string;
  ai_summary?: string;
  photos: Array<{
    file: File;
    dataUrl: string;
  }>;
}

class FieldReportService {
  /**
   * Durably saves a field inspection report and all photo attachments locally in IndexedDB
   * BEFORE any network upload is attempted.
   */
  public async createReport(input: CreateReportInput): Promise<{
    report: FieldReport;
    attachments: ReportAttachment[];
  }> {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const report: FieldReport = {
      id: reportId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      severity: input.severity,
      latitude: input.latitude,
      longitude: input.longitude,
      location_name: input.location_name || '',
      worker_id: 'field-worker-offline-node-01',
      notes: input.notes?.trim() || '',
      ai_summary: input.ai_summary || '',
      ai_status: input.ai_summary ? 'completed' : 'not_requested',
      sync_status: 'pending_sync',
      revision: 1,
      created_at: now,
      updated_at: now
    };

    const attachments: ReportAttachment[] = [];

    // Save report in transaction with attachments
    await db.transaction('rw', db.reports, db.attachments, db.syncOutbox, async () => {
      await db.reports.put(report);

      for (let i = 0; i < input.photos.length; i++) {
        const photo = input.photos[i];
        const attId = `att-${reportId}-${i + 1}`;
        const att: ReportAttachment = {
          id: attId,
          report_id: reportId,
          filename: photo.file.name,
          original_name: photo.file.name,
          mime_type: photo.file.type || 'image/jpeg',
          size_bytes: photo.file.size,
          data_url: photo.dataUrl,
          sync_status: 'pending',
          created_at: now
        };
        await db.attachments.put(att);
        attachments.push(att);
      }

      // Also record in syncOutbox so existing sync counters track this seamlessly!
      await db.syncOutbox.put({
        id: `outbox-${reportId}`,
        task_id: reportId,
        action: 'create',
        payload: {
          id: reportId,
          title: report.title,
          description: report.description,
          category: report.category,
          priority: report.severity,
          status: 'queued',
          revision: 1
        } as any,
        status: 'pending',
        retry_count: 0,
        created_at: now
      });
    });

    // Schedule synchronization with resource-aware scheduler
    await taskScheduler.scheduleTask('report_sync', reportId, report.severity);
    for (const att of attachments) {
      await taskScheduler.scheduleTask('attachment_sync', att.id, 'medium');
    }

    // Trigger sync if online
    if (networkSimulator.isEffectivelyOnline()) {
      this.syncReportToServer(reportId).catch(err => {
        console.warn('Background report sync attempt error:', err);
      });
    }

    return { report, attachments };
  }

  /**
   * Uploads report metadata to backend /api/reports.
   * Ensures idempotency: duplicate calls will not create duplicate records.
   */
  public async syncReportToServer(reportId: string): Promise<boolean> {
    const report = await db.reports.get(reportId);
    if (!report) return false;

    if (!networkSimulator.isEffectivelyOnline()) {
      return false;
    }

    report.sync_status = 'syncing';
    await db.reports.put(report);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          title: report.title,
          description: report.description,
          category: report.category,
          severity: report.severity,
          latitude: report.latitude,
          longitude: report.longitude,
          location_name: report.location_name,
          worker_id: report.worker_id,
          notes: report.notes,
          ai_summary: report.ai_summary,
          ai_status: report.ai_status,
          revision: report.revision,
          created_at: report.created_at
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      // Mark report as synced
      report.sync_status = 'synced';
      report.updated_at = new Date().toISOString();
      await db.reports.put(report);

      // Clean up outbox item for this report
      await db.syncOutbox.delete(`outbox-${reportId}`);

      // Sync any pending attachments for this report
      const pendingAtts = await db.attachments
        .where('report_id')
        .equals(reportId)
        .and(a => a.sync_status !== 'synced')
        .toArray();

      for (const att of pendingAtts) {
        await this.syncAttachmentToServer(att.id);
      }

      return true;
    } catch (err: any) {
      report.sync_status = 'sync_failed';
      await db.reports.put(report);
      throw err;
    }
  }

  /**
   * Uploads an individual photo attachment to /api/reports/{id}/attachments.
   * Independent retry: if one photo fails, retry without duplicating report.
   */
  public async syncAttachmentToServer(attachmentId: string): Promise<boolean> {
    const att = await db.attachments.get(attachmentId);
    if (!att) return false;

    if (!networkSimulator.isEffectivelyOnline()) {
      return false;
    }

    att.sync_status = 'syncing';
    await db.attachments.put(att);

    try {
      // Convert base64 data URL back to Blob
      const blob = await fetch(att.data_url).then(r => r.blob());

      const formData = new FormData();
      formData.append('file', blob, att.original_name);
      formData.append('attachment_id', att.id);

      const res = await fetch(`/api/reports/${att.report_id}/attachments`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Attachment upload HTTP ${res.status}`);
      }

      att.sync_status = 'synced';
      await db.attachments.put(att);
      return true;
    } catch (err: any) {
      att.sync_status = 'failed';
      await db.attachments.put(att);
      throw err;
    }
  }

  /**
   * Syncs all pending local reports and attachments
   */
  public async syncAllPendingReports(): Promise<{
    syncedReports: number;
    syncedAttachments: number;
  }> {
    if (!networkSimulator.isEffectivelyOnline()) {
      return { syncedReports: 0, syncedAttachments: 0 };
    }

    const pendingReports = await db.reports
      .where('sync_status')
      .anyOf(['pending_sync', 'sync_failed'])
      .toArray();

    let syncedReports = 0;
    for (const r of pendingReports) {
      try {
        const ok = await this.syncReportToServer(r.id);
        if (ok) syncedReports++;
      } catch (err) {
        console.warn(`Failed syncing report ${r.id}:`, err);
      }
    }

    const pendingAtts = await db.attachments
      .where('sync_status')
      .anyOf(['pending', 'failed'])
      .toArray();

    let syncedAttachments = 0;
    for (const a of pendingAtts) {
      try {
        const ok = await this.syncAttachmentToServer(a.id);
        if (ok) syncedAttachments++;
      } catch (err) {
        console.warn(`Failed syncing attachment ${a.id}:`, err);
      }
    }

    return { syncedReports, syncedAttachments };
  }

  public async getReportWithAttachments(reportId: string): Promise<{
    report: FieldReport;
    attachments: ReportAttachment[];
  } | null> {
    const report = await db.reports.get(reportId);
    if (!report) return null;
    const attachments = await db.attachments.where('report_id').equals(reportId).toArray();
    return { report, attachments };
  }

  public async getPendingCounts(): Promise<{
    pendingReports: number;
    pendingAttachments: number;
    failedReports: number;
    failedAttachments: number;
  }> {
    const pendingReports = await db.reports.where('sync_status').equals('pending_sync').count();
    const failedReports = await db.reports.where('sync_status').equals('sync_failed').count();
    const pendingAttachments = await db.attachments.where('sync_status').equals('pending').count();
    const failedAttachments = await db.attachments.where('sync_status').equals('failed').count();

    return { pendingReports, pendingAttachments, failedReports, failedAttachments };
  }
}

export const fieldReportService = new FieldReportService();
