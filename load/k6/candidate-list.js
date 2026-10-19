// Local-only load check of the candidate list and create endpoints. Never run against prod.
// k6 run -e BASE_URL=http://localhost:8000/ -e EMAIL=qa.recruiter1@flashyre-qa.example -e PASSWORD=... load/k6/candidate-list.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [{ duration: '20s', target: 10 }, { duration: '40s', target: 25 }, { duration: '10s', target: 0 }],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1500'] },
};
const BASE = __ENV.BASE_URL || 'http://localhost:8000/';

export function setup() {
  if (/prod/i.test(BASE)) throw new Error('Refusing to load-test a prod URL');
  const r = http.post(`${BASE}api/auth/token/`, JSON.stringify({ email: __ENV.EMAIL, password: __ENV.PASSWORD }), { headers: { 'Content-Type': 'application/json' } });
  check(r, { 'login ok': x => x.status === 200 });
  return { token: r.json('access') };
}

export default function (d) {
  const h = { headers: { Authorization: `Bearer ${d.token}` } };
  const list = http.get(`${BASE}api/candidates/?page=1`, h);
  check(list, { 'list 200': r => r.status === 200 });
  sleep(1);
}
