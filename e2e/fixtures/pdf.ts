/** Tiny PDF writer so tests need no extra dependency. Text is selectable, so the parser can read it. */
export function makePdf(lines: string[], padBytes = 0): Buffer {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let y = 760;
  const content = lines.map(l => { const t = `BT /F1 11 Tf 60 ${y} Td (${esc(l)}) Tj ET`; y -= 18; return t; }).join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
    offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('') +
    `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const buf = Buffer.from(out);
  return padBytes > 0 ? Buffer.concat([buf, Buffer.from(`\n%${'x'.repeat(padBytes)}\n`)]) : buf;
}

export interface Person { key: string; first: string; last: string; email: string; phone: string; skills: string;
  title: string; company: string; city: string; years: number; }

const BASE: Record<string, Omit<Person, 'key' | 'email' | 'phone'>> = {
  a: { first: 'Asha', last: 'Verma', skills: 'Python, Django, PostgreSQL, Docker', title: 'Backend Developer', company: 'Northwind Labs', city: 'Bengaluru', years: 4 },
  b: { first: 'Rohan', last: 'Mehta', skills: 'Java, Spring Boot, Kafka, AWS', title: 'Software Engineer', company: 'Contoso Systems', city: 'Pune', years: 6 },
  c: { first: 'Meera', last: 'Iyer', skills: 'Angular, TypeScript, RxJS, Node.js', title: 'Full Stack Developer', company: 'Fabrikam Tech', city: 'Hyderabad', years: 5 },
  y: { first: 'Dev', last: 'Nair', skills: 'PHP, Laravel, MySQL', title: 'Web Developer', company: 'Litware Inc', city: 'Kochi', years: 3 },
  z: { first: 'Zoya', last: 'Khan', skills: 'Ruby, Rails, Redis', title: 'Software Developer', company: 'Adatum Corp', city: 'Mumbai', years: 2 },
  d: { first: 'Kabir', last: 'Singh', skills: 'Go, Kubernetes, Terraform, GCP', title: 'DevOps Engineer', company: 'Tailspin Cloud', city: 'Chennai', years: 7 },
};

export function person(key: string, runId: string, letters: string, n = 0): Person {
  const b = BASE[key.split('-')[0]] ?? BASE['a'];
  const digits = [...runId].map(c => parseInt(c, 16) % 10).join('');
  return { key, ...b, first: `${b.first}${letters}`, email: `qa-${runId}-${key}@flashyre-qa.example`,
    phone: `9${digits}${n}`.slice(0, 10).padEnd(10, '0') };
}

export function resumeLines(p: Person): string[] {
  return [
    `${p.first} ${p.last}`, `Email: ${p.email}   Phone: ${p.phone}`, `Location: ${p.city}, India`, '',
    'PROFESSIONAL SUMMARY', `${p.title} with ${p.years} years of experience building production systems.`, '',
    'WORK EXPERIENCE', `${p.title} - ${p.company} (2020 - Present)`,
    '- Designed and shipped REST APIs and background workers.', '- Mentored junior engineers and led code reviews.', '',
    'SKILLS', p.skills, '', 'EDUCATION', 'B.E. Computer Science, Visvesvaraya Technological University, 2019',
  ];
}

export interface TestFile { name: string; mimeType: string; buffer: Buffer; }

/** Builds the file a scenario names. Kinds are listed in e2e/data/files.README. */
export function buildFile(kind: string, p: Person, tag: string): TestFile {
  const pdf = 'application/pdf';
  switch (kind) {
    case 'valid_pdf': return { name: `${tag}_${p.key}.pdf`, mimeType: pdf, buffer: makePdf(resumeLines(p)) };
    case 'unicode_name': return { name: `${tag}_résumé_测试.pdf`, mimeType: pdf, buffer: makePdf(resumeLines(p)) };
    case 'spaces_name': return { name: `${tag} my resume (final) v2.pdf`, mimeType: pdf, buffer: makePdf(resumeLines(p)) };
    case 'empty': return { name: `${tag}_empty.pdf`, mimeType: pdf, buffer: Buffer.alloc(0) };
    case 'fake_exe': return { name: `${tag}_fake.pdf`, mimeType: pdf, buffer: Buffer.concat([Buffer.from('MZ\x90\x00\x03'), Buffer.alloc(2048, 7)]) };
    case 'exe': return { name: `${tag}_tool.exe`, mimeType: 'application/octet-stream', buffer: Buffer.concat([Buffer.from('MZ\x90\x00\x03'), Buffer.alloc(2048, 7)]) };
    case 'text_as_pdf': return { name: `${tag}_notes.pdf`, mimeType: pdf, buffer: Buffer.from('this is just plain text, not a pdf\n'.repeat(20)) };
    case 'corrupt_pdf': return { name: `${tag}_corrupt.pdf`, mimeType: pdf, buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog').subarray(0, 40) };
    case 'blank_pdf': return { name: `${tag}_blank.pdf`, mimeType: pdf, buffer: makePdf([]) };
    case 'oversized': return { name: `${tag}_big.pdf`, mimeType: pdf, buffer: makePdf(resumeLines(p), 6 * 1024 * 1024) };
    case 'path_name': return { name: `..${'\\'}..${'\\'}${tag}_evil.pdf`, mimeType: pdf, buffer: makePdf(resumeLines(p)) };
    case 'no_email': { const q = { ...p, email: '' }; const l = resumeLines(q).filter(x => !x.startsWith('Email:')); return { name: `${tag}_noemail.pdf`, mimeType: pdf, buffer: makePdf(l) }; }
    default: throw new Error(`Unknown file kind: ${kind}`);
  }
}
