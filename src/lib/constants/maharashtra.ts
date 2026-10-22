import { EducationLevel, CurrentYear, IncomeRange, Interest, DocumentItem } from "@/types/database";

export const MAHARASHTRA_DISTRICTS = [
  { en: "Ahmednagar", mr: "अहमदनगर" },
  { en: "Akola", mr: "अकोला" },
  { en: "Amravati", mr: "अमरावती" },
  { en: "Chhatrapati Sambhajinagar", mr: "छत्रपती संभाजीनगर" },
  { en: "Beed", mr: "बीड" },
  { en: "Bhandara", mr: "भंडारा" },
  { en: "Buldhana", mr: "बुलढाणा" },
  { en: "Chandrapur", mr: "चंद्रपूर" },
  { en: "Dhule", mr: "धुळे" },
  { en: "Gadchiroli", mr: "गडचिरोली" },
  { en: "Gondia", mr: "गोंदिया" },
  { en: "Hingoli", mr: "हिंगोली" },
  { en: "Jalgaon", mr: "जळगाव" },
  { en: "Jalna", mr: "जालना" },
  { en: "Kolhapur", mr: "कोल्हापूर" },
  { en: "Latur", mr: "लातूर" },
  { en: "Mumbai City", mr: "मुंबई शहर" },
  { en: "Mumbai Suburban", mr: "मुंबई उपनगर" },
  { en: "Nagpur", mr: "नागपूर" },
  { en: "Nanded", mr: "नांदेड" },
  { en: "Nandurbar", mr: "नंदुरबार" },
  { en: "Nashik", mr: "नाशिक" },
  { en: "Dharashiv", mr: "धाराशिव" },
  { en: "Palghar", mr: "पालघर" },
  { en: "Parbhani", mr: "परभणी" },
  { en: "Pune", mr: "पुणे" },
  { en: "Raigad", mr: "रायगड" },
  { en: "Ratnagiri", mr: "रत्नागिरी" },
  { en: "Sangli", mr: "सांगली" },
  { en: "Satara", mr: "सातारा" },
  { en: "Sindhudurg", mr: "सिंधुदुर्ग" },
  { en: "Solapur", mr: "सोलापूर" },
  { en: "Thane", mr: "ठाणे" },
  { en: "Wardha", mr: "वर्धा" },
  { en: "Washim", mr: "वाशीम" },
  { en: "Yavatmal", mr: "यवतमाळ" }
];

export const EDUCATION_LEVELS: { value: EducationLevel; labelEn: string; labelMr: string }[] = [
  { value: "10th", labelEn: "10th (SSC)", labelMr: "१० वी (एसएससी)" },
  { value: "12th", labelEn: "12th (HSC)", labelMr: "१२ वी (एचएससी)" },
  { value: "Diploma", labelEn: "Diploma / Polytechnic", labelMr: "डिप्लोमा / तंत्रनिकेतन" },
  { value: "Undergraduate", labelEn: "Undergraduate (Degree)", labelMr: "पदवी (Undergraduate)" },
  { value: "Postgraduate", labelEn: "Postgraduate (Master's)", labelMr: "पदव्युत्तर (Postgraduate)" },
];

export const CURRENT_YEARS: { value: CurrentYear; labelEn: string; labelMr: string }[] = [
  { value: "First Year", labelEn: "First Year", labelMr: "प्रथम वर्ष" },
  { value: "Second Year", labelEn: "Second Year", labelMr: "द्वितीय वर्ष" },
  { value: "Third Year", labelEn: "Third Year", labelMr: "तृतीय वर्ष" },
  { value: "Fourth Year", labelEn: "Fourth Year", labelMr: "चौथे वर्ष" },
  { value: "Final Year", labelEn: "Final Year", labelMr: "अंतिम वर्ष" },
  { value: "Not Applicable", labelEn: "Not Applicable", labelMr: "लागू नाही" },
];

export const INCOME_RANGES: {
  value: IncomeRange;
  min: number;
  max: number;
  labelEn: string;
  labelMr: string;
}[] = [
  {
    value: "BELOW_1_LAKH",
    min: 0,
    max: 100000,
    labelEn: "Below ₹1,00,000",
    labelMr: "₹१,००,००० पेक्षा कमी",
  },
  {
    value: "1_TO_2_5_LAKH",
    min: 100000,
    max: 250000,
    labelEn: "₹1,00,000 – ₹2,50,000",
    labelMr: "₹१,००,००० – ₹२,५०,०००",
  },
  {
    value: "2_5_TO_5_LAKH",
    min: 250001,
    max: 500000,
    labelEn: "₹2,50,001 – ₹5,00,000",
    labelMr: "₹२,५०,००१ – ₹५,००,०००",
  },
  {
    value: "ABOVE_5_LAKH",
    min: 500001,
    max: 9999999,
    labelEn: "Above ₹5,00,000",
    labelMr: "₹५,००,००० पेक्षा जास्त",
  },
  {
    value: "PREFER_NOT_TO_SAY",
    min: 0,
    max: 9999999,
    labelEn: "Prefer not to say",
    labelMr: "सांगू इच्छित नाही",
  },
];

export const DEFAULT_INTERESTS: Interest[] = [
  { id: "int_scholarships", key: "SCHOLARSHIP", nameEn: "Scholarships", nameMr: "शिष्यवृत्ती" },
  { id: "int_internships", key: "INTERNSHIP", nameEn: "Internships", nameMr: "इंटर्नशिप" },
  { id: "int_exams", key: "GOVERNMENT_EXAM", nameEn: "Government Exams", nameMr: "शासकीय परीक्षा" },
  { id: "int_competitions", key: "COMPETITION", nameEn: "Competitions", nameMr: "स्पर्धा" },
  { id: "int_courses", key: "COURSE", nameEn: "Courses & Skills", nameMr: "कोर्सेस व कौशल्य" },
];

export const CATALOG_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc_marksheet",
    key: "marksheet",
    nameEn: "Marksheet (Previous Exam)",
    nameMr: "मागील परीक्षेची गुणपत्रिका",
    descriptionEn: "Passing certificate or latest semester marksheet",
    descriptionMr: "उत्तीर्ण प्रमाणपत्र किंवा ताज्या सत्राची गुणपत्रिका"
  },
  {
    id: "doc_income",
    key: "income_certificate",
    nameEn: "Income Certificate (Tehsildar)",
    nameMr: "तहसीलदार उत्पन्न दाखला",
    descriptionEn: "Valid annual family income certificate issued by competent revenue authority",
    descriptionMr: "सक्षम महसूल प्राधिकरणाने दिलेला वैध वार्षिक कौटुंबिक उत्पन्न दाखला"
  },
  {
    id: "doc_domicile",
    key: "domicile_certificate",
    nameEn: "Maharashtra Domicile Certificate",
    nameMr: "महाराष्ट्र अधिवास (डोमिसिल) दाखला",
    descriptionEn: "Proof of permanent residence in Maharashtra state",
    descriptionMr: "महाराष्ट्र राज्याचा कायमस्वरूपी रहिवासी असल्याचा दाखला"
  },
  {
    id: "doc_bonafide",
    key: "bonafide_certificate",
    nameEn: "College Bonafide Certificate",
    nameMr: "महाविद्यालय बोनाफाईड प्रमाणपत्र",
    descriptionEn: "Certificate proving active enrollment in recognized educational institution",
    descriptionMr: "मान्यताप्राप्त शिक्षण संस्थेत प्रवेश घेतल्याचा दाखला"
  },
  {
    id: "doc_bank",
    key: "bank_passbook",
    nameEn: "Bank Passbook / Cancelled Cheque",
    nameMr: "बँक पासबुक / रद्द केलेला धनादेश",
    descriptionEn: "Applicant's active savings bank account linked with Aadhaar",
    descriptionMr: "अर्जदाराचे आधारशी जोडलेले चालू बचत बँक खाते"
  },
  {
    id: "doc_admission",
    key: "admission_fee_receipt",
    nameEn: "Admission Fee Receipt (Current Year)",
    nameMr: "चालू वर्षाची प्रवेश शुल्क पावती",
    descriptionEn: "Official fee payment receipt for the academic year",
    descriptionMr: "शैक्षणिक वर्षाची अधिकृत शुल्क भरल्याची पावती"
  },
  {
    id: "doc_caste",
    key: "caste_certificate",
    nameEn: "Caste Certificate & Validity",
    nameMr: "जात प्रमाणपत्र व जात वैधता प्रमाणपत्र",
    descriptionEn: "Required for reserved category applicants (OBC, SC, ST, VJNT)",
    descriptionMr: "राखीव प्रवर्गातील विद्यार्थ्यांसाठी आवश्यक"
  },
  {
    id: "doc_resume",
    key: "resume_cv",
    nameEn: "Student Resume / CV",
    nameMr: "विद्यार्थी बायोडाटा / रेझ्युमे",
    descriptionEn: "Updated curriculum vitae for internships or competitions",
    descriptionMr: "इंटर्नशिप किंवा स्पर्धांसाठी अद्ययावत रेझ्युमे"
  }
];
