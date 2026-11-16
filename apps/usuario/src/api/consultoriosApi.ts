import { request } from './client';
import { Consultorio } from '../types/consultorio';

export async function fetchConsultorios(): Promise<Consultorio[]> {
  return request<Consultorio[]>('/consultorios');
}
