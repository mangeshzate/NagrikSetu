-- ==============================================================================
-- NagrikSetu Seed Data for Supabase
-- ==============================================================================

-- 1. Insert Interests
INSERT INTO public.interests (id, key, name_en, name_mr) VALUES
('a0000000-0000-0000-0000-000000000001', 'SCHOLARSHIP', 'Scholarships', 'शिष्यवृत्ती'),
('a0000000-0000-0000-0000-000000000002', 'INTERNSHIP', 'Internships', 'इंटर्नशिप'),
('a0000000-0000-0000-0000-000000000003', 'GOVERNMENT_EXAM', 'Government Exams', 'शासकीय परीक्षा'),
('a0000000-0000-0000-0000-000000000004', 'COMPETITION', 'Competitions', 'स्पर्धा'),
('a0000000-0000-0000-0000-000000000005', 'COURSE', 'Courses & Skills', 'कोर्सेस व कौशल्य')
ON CONFLICT (key) DO NOTHING;

-- 2. Insert Document Catalog
INSERT INTO public.documents (id, key, name_en, name_mr, description_en, description_mr) VALUES
('b0000000-0000-0000-0000-000000000001', 'marksheet', 'Marksheet (Previous Exam)', 'मागील परीक्षेची गुणपत्रिका', 'Passing certificate or latest semester marksheet', 'उत्तीर्ण प्रमाणपत्र किंवा ताज्या सत्राची गुणपत्रिका'),
('b0000000-0000-0000-0000-000000000002', 'income_certificate', 'Income Certificate (Tehsildar)', 'तहसीलदार उत्पन्न दाखला', 'Valid annual family income certificate issued by competent revenue authority', 'सक्षम महसूल प्राधिकरणाने दिलेला वैध वार्षिक कौटुंबिक उत्पन्न दाखला'),
('b0000000-0000-0000-0000-000000000003', 'domicile_certificate', 'Maharashtra Domicile Certificate', 'महाराष्ट्र अधिवास (डोमिसिल) दाखला', 'Proof of permanent residence in Maharashtra state', 'महाराष्ट्र राज्याचा कायमस्वरूपी रहिवासी असल्याचा दाखला'),
('b0000000-0000-0000-0000-000000000004', 'bonafide_certificate', 'College Bonafide Certificate', 'महाविद्यालय बोनाफाईड प्रमाणपत्र', 'Certificate proving active enrollment in recognized educational institution', 'मान्यताप्राप्त शिक्षण संस्थेत प्रवेश घेतल्याचा दाखला'),
('b0000000-0000-0000-0000-000000000005', 'bank_passbook', 'Bank Passbook / Cancelled Cheque', 'बँक पासबुक / रद्द केलेला धनादेश', 'Applicant active savings bank account linked with Aadhaar', 'अर्जदाराचे आधारशी जोडलेले चालू बचत बँक खाते'),
('b0000000-0000-0000-0000-000000000006', 'admission_fee_receipt', 'Admission Fee Receipt (Current Year)', 'चालू वर्षाची प्रवेश शुल्क पावती', 'Official fee payment receipt for the academic year', 'शैक्षणिक वर्षाची अधिकृत शुल्क भरल्याची पावती')
ON CONFLICT (key) DO NOTHING;

-- 3. Insert Verified Maharashtra Opportunities
INSERT INTO public.opportunities (
    id, slug, title, title_mr, type, provider, provider_mr, 
    short_description, short_description_mr, description, description_mr, 
    official_url, application_url, deadline, state_applicability, 
    education_level_applicability, current_year_applicability, income_max, 
    active, verification_status, verified_at, is_demo
) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'mahadbt-post-matric-ebc-scholarship',
    'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)',
    'राजर्षी छत्रपती शाहू महाराज शिक्षण शुल्क शिष्यवृत्ती योजना (ईबीसी)',
    'SCHOLARSHIP',
    'Directorate of Higher Education (DHE), Govt of Maharashtra',
    'उच्च शिक्षण संचालनालय, महाराष्ट्र शासन',
    '50% tuition & exam fee reimbursement for economically weaker students in diploma & degree courses.',
    'डिप्लोमा व पदवी अभ्यासक्रमातील आर्थिक दुर्बल विद्यार्थ्यांना ५०% शिक्षण शुल्क व परीक्षा शुल्क प्रतिपूर्ती.',
    'This flagship Maharashtra government scheme provides financial assistance towards tuition and examination fees to students from economically weaker sections pursuing diploma, professional, and non-professional higher education courses in recognized Maharashtra institutions.',
    'महाराष्ट्र शासनाची ही महत्त्वाची योजना मान्यताप्राप्त शिक्षण संस्थांमधील पदविका (Diploma) आणि पदवी अभ्यासक्रमांच्या विद्यार्थ्यांना शिक्षण व परीक्षा शुल्कात ५०% प्रतिपूर्ती देते.',
    'https://mahadbt.maharashtra.gov.in',
    'https://mahadbt.maharashtra.gov.in',
    CURRENT_DATE + INTERVAL '14 days',
    ARRAY['Maharashtra'],
    ARRAY['Diploma', 'Undergraduate', 'Postgraduate'],
    ARRAY['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Final Year'],
    800000,
    TRUE,
    'VERIFIED',
    NOW(),
    FALSE
),
(
    'c0000000-0000-0000-0000-000000000002',
    'dr-panjabrao-deshmukh-hostel-maintenance-allowance',
    'Dr. Panjabrao Deshmukh Hostel Maintenance Allowance Scheme',
    'डॉ. पंजाबराव देशमुख वसतिगृह निर्वाह भत्ता योजना',
    'SCHOLARSHIP',
    'Directorate of Technical Education (DTE), Maharashtra',
    'तंत्रशिक्षण संचालनालय, महाराष्ट्र राज्य',
    'Up to ₹30,000/year hostel maintenance allowance for students pursuing technical education outside home district.',
    'आपल्या तालुक्याबाहेर तांत्रिक शिक्षण घेणाऱ्या अल्पभूधारक व शेतमजूर पाल्यांसाठी वसतिगृह भत्ता.',
    'Financial allowance to children of registered small landholders, registered agricultural laborers, or low-income families residing in hostels or paying guest accommodations to pursue diploma/degree technical education.',
    'महाराष्ट्र राज्यातील शासकीय किंवा शासनमान्य संस्थेत तांत्रिक शिक्षण घेणाऱ्या आणि वसतिगृहात राहणाऱ्या गरजू विद्यार्थ्यांना मासिक निर्वाह भत्ता प्रदान करणारी योजना.',
    'https://mahadbt.maharashtra.gov.in',
    'https://mahadbt.maharashtra.gov.in',
    CURRENT_DATE + INTERVAL '4 days',
    ARRAY['Maharashtra'],
    ARRAY['Diploma', 'Undergraduate'],
    ARRAY['First Year', 'Second Year', 'Third Year', 'Final Year'],
    250000,
    TRUE,
    'VERIFIED',
    NOW(),
    FALSE
),
(
    'c0000000-0000-0000-0000-000000000003',
    'maharashtra-youth-tech-internship-program',
    'Maharashtra Youth Tech & Digital Governance Internship 2026',
    'महाराष्ट्र युवा तंत्रज्ञान व ई-प्रशासन इंटर्नशिप २०२६',
    'INTERNSHIP',
    'Maharashtra State Innovation Society (MSInS)',
    'महाराष्ट्र राज्य इनोव्हेशन सोसायटी',
    '3-month paid internship with ₹15,000 monthly stipend working with state departments on digital governance solutions.',
    'महाराष्ट्र शासनाच्या विविध विभागांमध्ये डिजिटल प्रकल्पांवर प्रत्यक्ष काम करण्याची ३ महिन्यांची सशुल्क संधी (₹१५,०००/महिना).',
    'An intensive civic-technology internship providing practical exposure to public policy, software engineering, citizen service digitalization, and product management across Maharashtra government secretariats.',
    'महाराष्ट्र शासनाच्या डिजिटलायझेशन प्रकल्पांवर काम करण्याची सुवर्णसंधी.',
    'https://msins.in',
    'https://msins.in/internships',
    CURRENT_DATE + INTERVAL '22 days',
    ARRAY['Maharashtra'],
    ARRAY['Diploma', 'Undergraduate', 'Postgraduate'],
    ARRAY['Third Year', 'Fourth Year', 'Final Year'],
    0,
    TRUE,
    'VERIFIED',
    NOW(),
    FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Eligibility Rules for MahaDBT EBC
INSERT INTO public.eligibility_rules (opportunity_id, field, operator, value, human_readable_label_en, human_readable_label_mr, required, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'state', 'EQUALS', '"Maharashtra"', 'Must be a permanent resident of Maharashtra State', 'अर्जदार महाराष्ट्र राज्याचा कायमस्वरूपी रहिवासी असणे आवश्यक आहे', TRUE, 1),
('c0000000-0000-0000-0000-000000000001', 'education_level', 'IN', '["Diploma", "Undergraduate", "Postgraduate"]', 'Enrolled in recognized Diploma, Undergraduate, or Postgraduate course', 'मान्यताप्राप्त पदविका (Diploma), पदवी किंवा पदव्युत्तर अभ्यासक्रमात प्रवेशित असणे आवश्यक', TRUE, 2),
('c0000000-0000-0000-0000-000000000001', 'family_income_max', 'LESS_THAN_EQUAL', '800000', 'Annual family income must not exceed ₹8,00,000', 'वार्षिक कौटुंबिक उत्पन्न ₹८,००,००० किंवा त्यापेक्षा कमी असणे बंधनकारक', TRUE, 3),
('c0000000-0000-0000-0000-000000000001', 'academic_percentage', 'GREATER_THAN_EQUAL', '50', 'Minimum 50% marks in previous examination', 'मागील परीक्षेत किमान ५०% गुण आवश्यक', TRUE, 4);

-- 5. Link Documents to Opportunities
INSERT INTO public.opportunity_documents (opportunity_id, document_id, required, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', TRUE, 1),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', TRUE, 2),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', TRUE, 3),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', TRUE, 4),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', TRUE, 5);
