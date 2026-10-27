export interface VerifiedKnowledgeEntry {
  id: string;
  category: 'crop_care' | 'irrigation' | 'infrastructure';
  topic: string;
  cropName: string;
  keywords: string[];
  symptoms: string[];
  verifiedAdvice: Record<string, string>; // Language code -> text
  provenance: string;
  source: string;
  clarifyingQuestions: Record<string, string[]>;
}

export const VERIFIED_LOCAL_KNOWLEDGE: VerifiedKnowledgeEntry[] = [
  {
    id: 'kb-areca-01',
    category: 'crop_care',
    topic: 'Koleroga (Fruit Rot) Management in Arecanut',
    cropName: 'Arecanut (ಅಡಿಕೆ / सुपारी)',
    keywords: ['arecanut', 'areca', 'koleroga', 'fruit rot', 'ಅಡಿಕೆ', 'ಕೊಳೆರೋಗ', 'ಸುಪಾರಿ'],
    symptoms: ['Premature falling of green arecanuts', 'Water-soaked lesions on nut surface', 'Foul-smelling white mycelial fungal growth'],
    verifiedAdvice: {
      'kn-IN': 'ಅಡಿಕೆ ಕೊಳೆರೋಗ (Phytophthora meadii) ಮಳೆಗಾಲದಲ್ಲಿ ತೀವ್ರವಾಗಿರುತ್ತದೆ. ಮುಂಗಾರು ಆರಂಭವಾಗುವ ಮುನ್ನವೇ ಗೊನೆಗಳಿಗೆ 1% ಬೋರ್ಡೋ ದ್ರಾವಣವನ್ನು ಸಿಂಪಡಿಸಬೇಕು. ನಂತರ 40 ದಿನಗಳ ಅಂತರದಲ್ಲಿ ಮರು ಸಿಂಪಡಣೆ ಮಾಡಿ. ತೋಟದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಬಸಿಗಾಲುವೆಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ.',
      'hi-IN': 'सुपारी में कोलेरोगा (फल सड़न) रोग वर्षा ऋतु में गंभीर होता है। मानसून शुरू होने से पहले गुच्छों पर 1% बोर्डो मिश्रण का छिड़काव करें और 40 दिनों बाद दोहराएं। बाग में जल निकासी की उचित व्यवस्था रखें।',
      'te-IN': 'పోక చెట్లలో కొలెరోగా (కాయ కుళ్లు) వర్షాకాలంలో తీవ్రంగా ఉంటుంది. వర్షాలు ప్రారంభమయ్యే ముందు గెలలపై 1% బోర్డో మిశ్రమాన్ని పిచికారీ చేయండి మరియు 40 రోజుల తర్వాత మళ్ళీ చేయండి. నీరు నిలవకుండా డ్రైనేజీని శుభ్రం చేయండి.',
      'ta-IN': 'பாக்கு மரத்தில் காயழுகல் நோய் மழைக்காலத்தில் தீவிரமாகும். பருவமழை தொடங்கும் முன் குலைகளுக்கு 1% போர்டோ கலவை தெளிக்கவும், 40 நாட்கள் கழித்து மீண்டும் தெளிக்கவும். தோட்டத்தில் தண்ணீர் தேங்காமல் வடிகால் அமைக்கவும்.',
      'en-US': 'Koleroga (Fruit rot) in Arecanut is caused by Phytophthora meadii during heavy rains. Spray prophylactic 1% Bordeaux mixture onto nut bunches before southwest monsoon onset, followed by a second spray 40-45 days later. Clear drainage channels to prevent root-zone water stagnation.'
    },
    provenance: 'Verified Agricultural Advisory Code: AGRI-KA-ARECA-01',
    source: 'University of Agricultural Sciences, Bangalore & ICAR-CPCRI Kasaragod',
    clarifyingQuestions: {
      'kn-IN': ['ಕಾಯಿ ಉದುರುವುದು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?', 'ಮರಗಳ ಬುಡದಲ್ಲಿ ನೀರು ನಿಂತಿದೆಯೇ?'],
      'hi-IN': ['फल गिरना कब शुरू हुआ?', 'क्या पेड़ की जड़ में जलभराव है?'],
      'te-IN': ['కాయలు రాలడం ఎప్పుడు ప్రారంభమైంది?', 'చెట్ల మొదట్లో నీరు నిలిచి ఉందా?'],
      'ta-IN': ['காய்கள் எப்போது விழத் தொடங்கின?', 'மரத்தின் அடியில் தண்ணீர் தேங்கியுள்ளதா?'],
      'en-US': ['When did nut dropping begin?', 'Is there persistent waterlogging at the tree base?']
    }
  },
  {
    id: 'kb-paddy-01',
    category: 'crop_care',
    topic: 'Blast Disease (ಬೆಂಕಿ ರೋಗ) in Paddy',
    cropName: 'Paddy / Rice (ಭತ್ತ / धान)',
    keywords: ['paddy', 'rice', 'blast', 'ಭತ್ತ', 'ಬೆಂಕಿ ರೋಗ', 'धान', 'झुलसा', 'వరి'],
    symptoms: ['Spindle or diamond-shaped lesions with grey center', 'Neck blast causing chaffy grains'],
    verifiedAdvice: {
      'kn-IN': 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗಕ್ಕೆ ಮೋಡ ಮುಸುಕಿದ ವಾತಾವರಣದಲ್ಲಿ ಹೆಚ್ಚಿನ ಪ್ರಮಾಣದ ಸಾರಜನಕ (ಯೂರಿಯಾ) ರಸಗೊಬ್ಬರ ಹಾಕುವುದನ್ನು ನಿಲ್ಲಿಸಿ. ಗದ್ದೆಯಲ್ಲಿ 2-3 ಸೆಂ.ಮೀ ಮಾತ್ರ ಸಮತಟ್ಟಾದ ನೀರನ್ನು ನಿರ್ವಹಿಸಿ. ಗದ್ದೆಯ ಬದುಗಳಲ್ಲಿರುವ ಕಳೆ ಗಿಡಗಳನ್ನು ತೆಗೆದುಹಾಕಿ.',
      'hi-IN': 'धान के झुलसा रोग (ब्लास्ट) के दौरान अत्यधिक यूरिया का प्रयोग रोक दें। खेत में केवल 2-3 सेमी पानी का स्तर बनाए रखें और मेड़ों से खरपतवार तुरंत हटाएं।',
      'te-IN': 'వరిలో అగ్గి తెగులు నివారణకు మోతాదుకు మించి యూరియా వేయకండి. పొలంలో 2-3 సెం.మీ నీటి మట్టాన్ని మాత్రమే నిర్వహించండి. గట్లపై కలుపు మొక్కలను తొలగించండి.',
      'ta-IN': 'நெல் குலை நோய் கட்டுப்பாட்டிற்கு அதிகப்படியான யூரியா இடுவதைத் தவிர்க்கவும். வயலில் 2-3 செ.மீ அளவு நீர்மட்டம் பராமரிக்கவும். வரப்புகளில் உள்ள களைகளை அகற்றவும்.',
      'en-US': 'Paddy blast (Pyricularia oryzae) thrives in high humidity and overcast skies. Avoid excessive chemical nitrogen/urea top-dressing during cloud cover. Maintain a shallow 2-3 cm water layer and clear weed hosts on bunds.'
    },
    provenance: 'Verified Agricultural Advisory Code: AGRI-KA-PADDY-04',
    source: 'ICAR-Indian Institute of Rice Research & UAS Dharwad',
    clarifyingQuestions: {
      'kn-IN': ['ರೋಗವು ಎಲೆಯಲ್ಲಿದೆಯೇ ಅಥವಾ ತೆನೆಯ ಬುಡದಲ್ಲಿದೆಯೇ (ಕುತ್ತಿಗೆ ಬೆಂಕಿ ರೋಗ)?', 'ಬೆಳೆಯು ಯಾವ ಹಂತದಲ್ಲಿದೆ?'],
      'hi-IN': ['क्या धब्बे पत्तियों पर हैं या बाली की गर्दन पर?', 'फसल किस विकास चरण में है?'],
      'te-IN': ['మచ్చలు ఆకులపై ఉన్నాయా లేక వెన్నుపై ఉన్నాయా?', 'పంట ఏ ఎదుగుదల దశలో ఉంది?'],
      'ta-IN': ['புள்ளிகள் இலைகளிலா அல்லது கதிர் கழுத்திலா?', 'பயிர் எந்த வளர்ச்சி நிலையில் உள்ளது?'],
      'en-US': ['Are spindle lesions on the leaves or the panicle neck?', 'What is the current crop growth stage?']
    }
  },
  {
    id: 'kb-ragi-01',
    category: 'crop_care',
    topic: 'Finger Millet (Ragi) Blast & Cultural Practices',
    cropName: 'Finger Millet / Ragi (ರಾಗಿ / रागी)',
    keywords: ['ragi', 'finger millet', 'ರಾಗಿ', 'blast', 'ಮಂಡುವ'],
    symptoms: ['Circular to oval lesions on nursery seedlings', 'Brown necrotic patches on earheads'],
    verifiedAdvice: {
      'kn-IN': 'ರಾಗಿ ಬೆಳೆಗಾರರು ಬಿತ್ತನೆಗೆ ಮುನ್ನ ಬೀಜೋಪಚಾರ ಮಾಡಬೇಕು. ಸಾಲಿನಿಂದ ಸಾಲಿಗೆ 22.5 ಸೆಂ.ಮೀ ಹಾಗೂ ಗಿಡದಿಂದ ಗಿಡಕ್ಕೆ 10 ಸೆಂ.ಮೀ ಅಂತರ ಕಾಪಾಡಿ. ಸಾವಯವ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರದ ಜೊತೆಗೆ ಜೈವಿಕ ಗೊಬ್ಬರಗಳನ್ನು ಬಳಸಿ.',
      'hi-IN': 'रागी में बीज बोने से पहले बीजोपचार अवश्य करें। पंक्ति से पंक्ति 22.5 सेमी और पौधे से पौधा 10 सेमी की दूरी रखें। संतुलित जैविक खाद का प्रयोग करें।',
      'te-IN': 'రాగుల పంటలో విత్తన శుద్ధి తప్పక చేయాలి. వరుసల మధ్య 22.5 సెం.మీ మరియు మొక్కల మధ్య 10 సెం.మీ దూరం పాటించండి. సేంద్రీయ ఎరువులను వాడండి.',
      'ta-IN': 'கேழ்வரகு பயிரில் விதை நேர்த்தி செய்து விதைக்கவும். வரிசைக்கு வரிசை 22.5 செ.மீ இடைவெளி பராமரிக்கவும். மக்கிய தொழுவுரம் பயன்படுத்தவும்.',
      'en-US': 'Finger millet (Ragi) requires certified seed treatment before sowing. Maintain recommended field spacing of 22.5 cm between rows and 10 cm between plants for adequate aeration. Combine organic farmyard manure with balanced bio-fertilizers.'
    },
    provenance: 'Verified Agricultural Advisory Code: AGRI-KA-RAGI-02',
    source: 'All India Coordinated Research Project on Small Millets, GKVK Bangalore',
    clarifyingQuestions: {
      'kn-IN': ['ರಾಗಿ ಬಿತ್ತನೆ ಮಳೆಯಾಶ್ರಿತವೇ ಅಥವಾ ನೀರಾವರಿಯೇ?', 'ತೆನೆ ಮೂಡುವ ಹಂತ ತಲುಪಿದೆಯೇ?'],
      'hi-IN': ['क्या फसल वर्षा आधारित है या सिंचित?', 'क्या बाली आने की अवस्था है?'],
      'te-IN': ['పంట వర్షాధారమా లేక నీటిపారుదలా?', 'కంకి వచ్చే దశలో ఉందా?'],
      'ta-IN': ['பயிர் மானாவாரியா அல்லது பாசனமா?', 'கதிர் வெளிவரும் பருவமா?'],
      'en-US': ['Is the ragi crop rainfed or irrigated?', 'Has earhead emergence begun?']
    }
  },
  {
    id: 'kb-tomato-01',
    category: 'crop_care',
    topic: 'Tomato Leaf Curl Virus & Blight Control',
    cropName: 'Tomato (ಟೊಮೆಟೊ / टमाटर)',
    keywords: ['tomato', 'curl', 'blight', 'ಟೊಮೆಟೊ', 'ಸುರುಟು', 'ಎಲೆ ಮುದುಡು', 'टमाटर'],
    symptoms: ['Stunted growth with upward leaf curling', 'Thickened leathery leaves', 'Vector whitefly population'],
    verifiedAdvice: {
      'kn-IN': 'ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು ರೋಗವು ಬಿಳಿ ನೊಣಗಳಿಂದ ಹರಡುತ್ತದೆ. ಎಕರೆಗೆ 15-20 ಹಳದಿ ಅಂಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ. ಚಿಮುಕಿಸುವ ಸ್ಪ್ರಿಂಕ್ಲರ್ ಬದಲಿಗೆ ಹನಿ ನೀರಾವರಿ ಬಳಸಿ ಎಲೆಗಳು ಒಣಗಿರಲು ಬಿಡಿ.',
      'hi-IN': 'टमाटर का पत्ती मरोड़ रोग सफेद मक्खी द्वारा फैलता है। प्रति एकड़ 15-20 पीले चिपचिपे जाल लगाएं। फव्वारा सिंचाई के बजाय ड्रिप का उपयोग करें।',
      'te-IN': 'టమాట ఆకు ముడత తెగులు తెల్లదోమల వల్ల వ్యాపిస్తుంది. ఎకరాకు 15-20 పసుపు రంగు జిగురు కార్డులను ఏర్పాటు చేయండి. బిందు సేద్యం ఉపయోగించండి.',
      'ta-IN': 'தக்காளி இலைச்சுருள் நோய் வெள்ளை ஈக்கள் மூலம் பரவுகிறது. ஏக்கருக்கு 15-20 மஞ்சள் வண்ண ஒட்டும் பொறிகளை அமைக்கவும். சொட்டு நீர் பாசனம் பயன்படுத்தவும்.',
      'en-US': 'Tomato leaf curl virus is vector-transmitted by whiteflies (Bemisia tabaci). Install 15-20 yellow sticky traps per acre to monitor and suppress vector insects. Prefer drip irrigation over overhead sprinklers to keep foliage dry and reduce fungal blights.'
    },
    provenance: 'Verified Agricultural Advisory Code: AGRI-KA-TOMATO-03',
    source: 'ICAR-Indian Institute of Horticultural Research (IIHR, Hessaraghatta)',
    clarifyingQuestions: {
      'kn-IN': ['ಎಲೆಗಳ ಕೆಳಭಾಗದಲ್ಲಿ ಸಣ್ಣ ಬಿಳಿ ನೊಣಗಳು ಕಂಡುಬರುತ್ತಿವೆಯೇ?', 'ಗಿಡಗಳು ಕುಬ್ಜವಾಗುತ್ತಿವೆಯೇ?'],
      'hi-IN': ['क्या पत्तियों के नीचे छोटी सफेद मक्खियां हैं?', 'क्या पौधे बौने हो रहे हैं?'],
      'te-IN': ['ఆకుల కింద తెల్లదోమలు కనిపిస్తున్నాయా?', 'మొక్కల పెరుగుదల ఆగిపోయిందా?'],
      'ta-IN': ['இலைகளின் அடியில் வெள்ளை ஈக்கள் காணப்படுகிறதா?', 'செடிகள் குட்டையாகின்றதா?'],
      'en-US': ['Do you observe small whiteflies under leaf surfaces?', 'Is overall plant height severely stunted?']
    }
  },
  {
    id: 'kb-water-01',
    category: 'infrastructure',
    topic: 'Borewell & Hand Pump Rural Water Diagnostic',
    cropName: 'Water Utility (ಕುಡಿಯುವ ನೀರು / जल आपूर्ति)',
    keywords: ['water', 'pump', 'handpump', 'borewell', 'ನೀರು', 'ಕೊಳವೆಬಾವಿ', 'ಕೈಪಂಪು', 'नल'],
    symptoms: ['Handle moves freely without pumping water', 'Muddy or saline water extraction', 'Chain link detached'],
    verifiedAdvice: {
      'kn-IN': 'ಕೈಪಂಪು ನೀರು ಬಾರದಿದ್ದಾಗ ಚೈನ್ ಕೊಂಡಿ, ಸಿಲಿಂಡರ್ ವಾಷರ್ ಹಾಗೂ ಫುಟ್‌ವಾಲ್ವ್ ಲೆದರ್ ಪ್ಯಾಕಿಂಗ್ ಪರಿಶೀಲಿಸಿ. ಅಂತರ್ಜಲ ಮಟ್ಟ ಕುಸಿದಿದ್ದರೆ ರೈಸರ್ ಪೈಪ್ ವಿಸ್ತರಿಸಿ ಅಥವಾ ಪಂಚಾಯಿತಿಯಿಂದ ತಕ್ಷಣ ಟ್ಯಾಂಕರ್ ನೀರು ಒದಗಿಸಿ.',
      'hi-IN': 'हैंडपंप से पानी न आने पर हैंडल चेन, सिलेंडर वॉशर और फुट वाल्व की जांच करें। यदि भूजल स्तर नीचे चला गया है, तो पाइप बढ़ाएं या पंचायत से तुरंत टैंकर मंगवाएं।',
      'te-IN': 'చేతి పంపు నుండి నీరు రాకపోతే చైన్ లింక్, సిలిండర్ వాషర్ మరియు ఫుట్ వాల్వ్ తనిఖీ చేయండి. భూగర్భ జలాలు తగ్గిపోతే పైపును పొడిగించండి లేదా పంచాయితీ నుండి ట్యాంకర్ ఏర్పాటు చేయండి.',
      'ta-IN': 'கைப்பம்பில் தண்ணீர் வரவில்லை என்றால் செயின் இணைப்பு மற்றும் வால்வை சரிபார்க்கவும். நிலத்தடி நீர் மட்டம் குறைந்தால் குழாயை நீட்டிக்கவும் அல்லது அவசர டேங்கர் ஏற்பாடு செய்யவும்.',
      'en-US': 'For non-functioning rural hand pumps, inspect the handle chain, cylinder washer, and foot-valve leather packing. If groundwater static level has dropped below the suction threshold, install additional riser pipe lengths or request interim Panchayat water tanker supply.'
    },
    provenance: 'Verified Civic Infrastructure Code: CIVIC-RWSS-01',
    source: 'Rural Water Supply & Sanitation Department, Govt of Karnataka',
    clarifyingQuestions: {
      'kn-IN': ['ಹ್ಯಾಂಡಲ್ ಸಲೀಸಾಗಿ ಮೇಲೆ ಕೆಳಗೆ ಹೋಗುತ್ತಿದೆಯೇ ಅಥವಾ ಜಡವಾಗಿದೆಯೇ?', 'ಎಷ್ಟು ಕುಟುಂಬಗಳು ಈ ಪಂಪನ್ನು ಅವಲಂಬಿಸಿವೆ?'],
      'hi-IN': ['क्या हैंडल ढीला है या भारी?', 'कितने परिवार इस हैंडपंप पर निर्भर हैं?'],
      'te-IN': ['హ్యాండిల్ తేలికగా కదులుతోందా లేదా బిగుతుగా ఉందా?', 'ఎన్ని కుటుంబాలు దీనిపై ఆధారపడి ఉన్నాయి?'],
      'ta-IN': ['ஹேண்டில் எளிதாக அசைகிறதா அல்லது கடினமாக உள்ளதா?', 'எத்தனை குடும்பங்கள் இதை நம்பியுள்ளன?'],
      'en-US': ['Does the handle move loosely without resistance, or is it jammed?', 'How many households depend on this water source?']
    }
  }
];

export function queryLocalKnowledge(query: string, lang: string = 'kn-IN'): {
  entry: VerifiedKnowledgeEntry;
  advice: string;
  clarifyingQuestions: string[];
} | null {
  const q = query.toLowerCase();
  for (const item of VERIFIED_LOCAL_KNOWLEDGE) {
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        const advice = item.verifiedAdvice[lang] || item.verifiedAdvice['en-US'];
        const clarifyingQuestions = item.clarifyingQuestions[lang] || item.clarifyingQuestions['en-US'] || [];
        return { entry: item, advice, clarifyingQuestions };
      }
    }
  }
  return null;
}
