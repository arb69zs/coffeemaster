import axios from 'axios';

const API_URL = '/suppliers';

export const suppliersAPI = {
  getAll: () => axios.get(API_URL).then(res => res.data),
  getById: (id: number) => axios.get(`${API_URL}/${id}`).then(res => res.data),
  create: (data: any) => axios.post(API_URL, data).then(res => res.data),
  update: (id: number, data: any) => axios.put(`${API_URL}/${id}`, data).then(res => res.data),
  remove: (id: number) => axios.delete(`${API_URL}/${id}`).then(res => res.data),
}; 