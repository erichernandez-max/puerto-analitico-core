import { request } from './client';
import { Producto } from '../types/producto';

export async function fetchProductos(): Promise<Producto[]> {
  return request<Producto[]>('/productos');
}
