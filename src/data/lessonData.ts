import { VacancyInfo, QuizQuestion, BattleQuestion } from '../types';

export const VACANCY_DATA: VacancyInfo = {
  company: 'Prima Audio Elektronik',
  role: 'Audio Video Technician Assistant',
  address: '25 Jalan Merdeka, Nganjuk, East Java',
  source: 'School Career Board & Vocational Partnership',
  requirements: [
    'Identify basic electronic components (resistors, capacitors, transistors, ICs) and read simple circuit diagrams',
    'Assist with assembly and testing of simple audio systems using workshop safety procedures (K3)',
    'Use basic measuring instruments (analog & digital multimeter, oscilloscope), record results, and work effectively in a team'
  ],
  instruction: 'Write a complete application letter in formal English. Use 100–150 words in the three main paragraphs and include truthful evidence from your electronics practical project.',
  note: 'Perusahaan, lowongan, dan identitas pada contoh merupakan simulasi pembelajaran terarah untuk Kelas XI TAV.'
};

export const STRUCTURE_PARTS: [string, string][] = [
  ['Applicant’s Address', 'Alamat dan kontak pelamar (nama, kota, email, telepon).'],
  ['Date', 'Tanggal resmi penulisan surat lamaran.'],
  ['Employer’s Address', 'Nama/jabatan penerima dan alamat lengkap perusahaan yang dituju.'],
  ['Salutation', 'Sapaan pembuka formal, contohnya “Dear Hiring Manager,” atau nama penerima jika diketahui.'],
  ['Opening Paragraph', 'Menyebutkan posisi yang dilamar dan sumber informasi lowongan pekerjaan.'],
  ['Body Paragraph', 'Menjelaskan kualifikasi, keterampilan elektronika, dan bukti pengalaman proyek praktik sekolah yang relevan.'],
  ['Closing Paragraph', 'Menyampaikan ketertarikan untuk wawancara, ketersediaan portofolio, dan ucapan terima kasih.'],
  ['Complimentary Close', 'Salam penutup resmi, contohnya “Yours sincerely,” atau “Yours faithfully,”.'],
  ['Signature', 'Tanda tangan dan nama lengkap pelamar.']
];

export const SAMPLE_LETTER: [string, string][] = [
  ['Applicant’s Address', 'Raka Pratama\nNganjuk, East Java\nraka.pratama@example.com'],
  ['Date', '10 November 2026'],
  ['Employer’s Address', 'Hiring Manager\nPrima Audio Elektronik\n25 Jalan Merdeka, Nganjuk'],
  ['Salutation', 'Dear Hiring Manager,'],
  ['Opening Paragraph', 'I am writing to apply for the Audio Video Technician Assistant position advertised on the school career board. I am currently a Grade XI student majoring in Audio Video Engineering at SMK PGRI 1 Nganjuk. I am eager to contribute my technical foundation to your workshop team.'],
  ['Body Paragraph', 'During a supervised practical project at school, I assembled a low-voltage audio amplifier together with my teammates. I identified electronic components, read the schematic circuit diagram, and verified connections with a digital multimeter under my teacher’s guidance. I also recorded testing results and followed strict workshop safety procedures. Working in a team of four, we successfully documented signal output and ensured zero wiring faults.'],
  ['Closing Paragraph', 'I would welcome the opportunity to discuss my application and practical background in an interview. My student project portfolio and practical logbook are available upon request. Thank you for your time and consideration.'],
  ['Complimentary Close', 'Yours sincerely,'],
  ['Signature', 'Raka Pratama']
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: 'What is the main purpose of an application letter?',
    options: [
      'To apply for a specific job and explain relevant qualifications',
      'To invite a colleague to an electronics exhibition',
      'To report the result of an audio measurement experiment',
      'To order replacement parts for an audio amplifier'
    ],
    key: 0,
    why: 'Surat lamaran bertujuan menyatakan posisi yang dilamar dan menghubungkan keterampilan pelamar dengan kebutuhan pekerjaan.',
    topic: 'Fungsi Sosial'
  },
  {
    q: 'Which section contains the applicant’s name and contact information?',
    options: [
      'Complimentary close',
      'Applicant’s address',
      'Salutation',
      'Employer’s address'
    ],
    key: 1,
    why: 'Applicant’s address berada di bagian paling atas untuk mencantumkan identitas dan kontak pengirim.',
    topic: 'Struktur Surat'
  },
  {
    q: 'Which is the most appropriate formal salutation when the hiring manager’s name is unknown?',
    options: [
      'Hey buddy!',
      'Hi team,',
      'Dear Hiring Manager,',
      'To all technicians,'
    ],
    key: 2,
    why: 'Dear Hiring Manager adalah standar sapaan formal jika nama spesifik belum diketahui.',
    topic: 'Ungkapan Formal'
  },
  {
    q: 'Which sentence correctly describes an existing electronics skill using simple present tense?',
    options: [
      'I can identifies audio components.',
      'I has basic electronics skills.',
      'I reading a circuit diagram.',
      'I use a multimeter in supervised practical lessons.'
    ],
    key: 3,
    why: 'Pola simple present yang benar adalah subjek I + verb 1 (use) tanpa akhiran -s.',
    topic: 'Tata Bahasa'
  },
  {
    q: 'In job recruitment, what does the term “qualifications” refer to?',
    options: [
      'Skills, education, and practical experience relevant to the job',
      'The applicant’s personal hobbies only',
      'The company’s inventory list',
      'The layout style of the document'
    ],
    key: 0,
    why: 'Qualifications mencakup keterampilan, pendidikan, dan pengalaman nyata yang relevan.',
    topic: 'Kosakata'
  },
  {
    q: 'Where should an audio amplifier school project be placed as evidence of practical skills?',
    options: [
      'Date section',
      'Body paragraph',
      'Salutation',
      'Complimentary close'
    ],
    key: 1,
    why: 'Body paragraph adalah tempat utama untuk membuktikan keterampilan melalui proyek nyata.',
    topic: 'Struktur Surat'
  },
  {
    q: 'Choose the most courteous and professional formal expression for an interview request:',
    options: [
      'Give me an interview right now.',
      'I really wanna work here as soon as possible.',
      'I would welcome the opportunity to discuss my application in an interview.',
      'You must call me tomorrow.'
    ],
    key: 2,
    why: 'Ungkapan “I would welcome the opportunity...” sopan, profesional, dan menunjukkan kesiapan.',
    topic: 'Ungkapan Formal'
  },
  {
    q: '“During a school practical project, I assembled an audio amplifier.” Why is “assembled” used here?',
    options: [
      'Every verb in an application letter must always be past tense',
      'The practical project is scheduled for next semester',
      'It describes an address location',
      'It describes a completed practical experience in the past'
    ],
    key: 3,
    why: 'Assembled berbentuk Simple Past karena kegiatan perakitan tersebut telah selesai dikerjakan.',
    topic: 'Analisis Bahasa'
  },
  {
    q: 'The job vacancy requires measurement skills and safety procedure compliance. Which evidence matches best?',
    options: [
      'I checked circuit connections with a multimeter following workshop safety procedures under teacher supervision.',
      'My favorite music genre is electronic dance music.',
      'I live five minutes away from the electronics repair store.',
      'I enjoy watching electronics unboxing videos online.'
    ],
    key: 0,
    why: 'Menyebutkan penggunaan multimeter secara nyata dan prosedur K3 langsung menjawab kualifikasi lowongan.',
    topic: 'Analisis Bukti'
  },
  {
    q: 'A vocational student has no paid industrial work experience yet. What is the most ethical and effective strategy?',
    options: [
      'Claim three years of professional technician service',
      'Describe a verified electronics practical project and personal contribution truthfully',
      'Copy the company requirements verbatim without any evidence',
      'Delete the body paragraph completely'
    ],
    key: 1,
    why: 'Menjelaskan bukti proyek sekolah dan kontribusi nyata secara jujur lebih meyakinkan daripada mengarang pengalaman.',
    topic: 'Etika & Evaluasi'
  }
];

export const BATTLE_QUESTIONS: BattleQuestion[] = [
  {
    type: 'choice',
    category: 'Tebak bagian surat',
    prompt: '“I am writing to apply for the Audio Video Technician Assistant position advertised on the school career board.” Kalimat ini termasuk bagian apa?',
    options: ['Opening paragraph', 'Body paragraph', 'Closing paragraph', 'Signature'],
    answer: 0,
    why: 'Opening paragraph menyebutkan posisi yang dilamar dan sumber informasi lowongan.'
  },
  {
    type: 'text',
    category: 'Perbaiki kalimat',
    prompt: 'Perbaiki tata bahasa: “I can identifies electronic components.”',
    answer: 'I can identify electronic components.',
    why: 'Setelah modal verb "can", gunakan kata kerja bentuk dasar (bare infinitive): identify.'
  },
  {
    type: 'choice',
    category: 'Pilih bukti keterampilan',
    prompt: 'Lowongan meminta kemampuan membaca skema rangkaian. Bukti pengalaman mana yang paling meyakinkan dan relevan?',
    options: [
      'I enjoy watching audio reviews on social media.',
      'I read a circuit schematic diagram to assemble an audio amplifier in a supervised school project.',
      'I live near the electronics workshop.',
      'I have the best electronics equipment at home.'
    ],
    answer: 1,
    why: 'Menyebutkan membaca diagram skema untuk merakit penguat audio adalah bukti kompetensi nyata.'
  },
  {
    type: 'order',
    category: 'Susun struktur awal',
    prompt: 'Susun empat bagian pembuka surat lamaran berikut sesuai format baku.',
    items: [
      { id: 'd', label: 'Date' },
      { id: 'e', label: 'Employer’s address' },
      { id: 's', label: 'Salutation' },
      { id: 'o', label: 'Opening paragraph' }
    ],
    order: ['s', 'o', 'd', 'e'],
    answer: ['d', 'e', 's', 'o'],
    why: 'Urutan formal setelah alamat pelamar adalah: Date → Employer’s Address → Salutation → Opening Paragraph.'
  },
  {
    type: 'choice',
    category: 'Tebak bagian surat',
    prompt: '“During a school practical project, I assembled an audio amplifier and tested the output with an oscilloscope.” Bukti ini berada di bagian apa?',
    options: ['Date', 'Salutation', 'Body paragraph', 'Complimentary close'],
    answer: 2,
    why: 'Body paragraph memuat elaborasi kompetensi teknis dan bukti proyek kejuruan.'
  },
  {
    type: 'text',
    category: 'Perbaiki bentuk waktu (Tense)',
    prompt: 'Perbaiki kata kerja lampau: “Last month, I assemble an audio amplifier.”',
    answer: 'Last month, I assembled an audio amplifier.',
    why: 'Keterangan waktu "Last month" menandai aktivitas lampau yang sudah tuntas, sehingga gunakan "assembled".'
  },
  {
    type: 'choice',
    category: 'Pilih bukti keterampilan',
    prompt: 'Lowongan meminta kerja sama tim dan pencatatan hasil pengukuran. Kalimat mana yang membuktikan keduanya?',
    options: [
      'I worked with three classmates to test an amplifier and recorded all measurement values in our logbook.',
      'I prefer working alone without writing down measurements.',
      'My friend and I like testing speakers loudly.',
      'I can solder components without any notes.'
    ],
    answer: 0,
    why: 'Bekerja dengan tiga teman membuktikan teamwork, dan mencatat nilai pengukuran membuktikan ketelitian dokumentasi.'
  },
  {
    type: 'order',
    category: 'Susun bagian surat',
    prompt: 'Susun alur isi dan penutup surat lamaran ini dari awal hingga akhir.',
    items: [
      { id: 'o', label: 'Opening paragraph' },
      { id: 'b', label: 'Body paragraph' },
      { id: 'c', label: 'Closing paragraph' },
      { id: 'f', label: 'Complimentary close' },
      { id: 's', label: 'Signature' }
    ],
    order: ['c', 's', 'o', 'f', 'b'],
    answer: ['o', 'b', 'c', 'f', 's'],
    why: 'Urutan baku: Opening → Body → Closing → Complimentary close → Signature.'
  },
  {
    type: 'choice',
    category: 'Tebak bagian surat',
    prompt: '“I would welcome the opportunity to discuss my application in an interview. Thank you for your time and consideration.” Termasuk bagian apa?',
    options: ['Employer’s address', 'Signature', 'Body paragraph', 'Closing paragraph'],
    answer: 3,
    why: 'Permohonan wawancara dan ucapan terima kasih merupakan karakteristik khas Closing Paragraph.'
  },
  {
    type: 'text',
    category: 'Perbaiki subjek & kata kerja',
    prompt: 'Perbaiki: “I uses a multimeter in supervised practical lessons.”',
    answer: 'I use a multimeter in supervised practical lessons.',
    why: 'Subjek "I" pada Simple Present Tense menggunakan bentuk dasar "use" (tanpa -s).'
  },
  {
    type: 'choice',
    category: 'Pilih bukti keterampilan',
    prompt: 'Siswa SMK baru berlatih di bengkel sekolah dan belum pernah bekerja formal di industri. Kalimat mana yang paling tepat dan jujur?',
    options: [
      'I have managed a commercial electronics factory for ten years.',
      'I hold every international audio engineering license.',
      'I verified circuit connections with a multimeter and followed workshop safety under my teacher’s supervision.',
      'I have mastered all industrial repairs with no mistakes.'
    ],
    answer: 2,
    why: 'Menjelaskan verifikasi multimeter dan K3 di bawah bimbingan guru adalah bukti nyata yang jujur dan profesional.'
  },
  {
    type: 'order',
    category: 'Urutkan fungsi tiga paragraf utama',
    prompt: 'Urutkan fungsi dari ketiga paragraf utama surat lamaran kerja.',
    items: [
      { id: 'p', label: 'Sebutkan posisi dan sumber lowongan' },
      { id: 'b', label: 'Jelaskan keterampilan elektronika dan bukti praktik' },
      { id: 'w', label: 'Sampaikan kesediaan wawancara dan terima kasih' }
    ],
    order: ['w', 'p', 'b'],
    answer: ['p', 'b', 'w'],
    why: 'Paragraf 1 (Opening) = posisi; Paragraf 2 (Body) = bukti keterampilan; Paragraf 3 (Closing) = wawancara & apresiasi.'
  }
];
