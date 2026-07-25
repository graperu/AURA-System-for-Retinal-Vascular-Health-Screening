import {useState} from 'react';
import {apiClient} from '../services/apiClient';
import type {HealthResponse} from '../types/health';
export default function HomePage(){
 const [result,setResult]=useState('Chưa kiểm tra');
 const check=async()=>{try{const {data}=await apiClient.get<HealthResponse>('/health');setResult(`${data.service}: ${data.status}`)}catch{setResult('Backend không khả dụng')}};
 return <main><h1>AURA</h1><p>Retinal Vascular Health Screening</p><p>Frontend: UP</p><button onClick={check}>Kiểm tra Backend</button><p aria-live="polite">{result}</p></main>;
}
