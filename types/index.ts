export interface Ticket {
  id: string;
  photoUri: string;
  thumbnailUri?: string;
  title: string;
  note: string;
  location: string;
  date: string;
  timestamp: number;
  createdAt: string;
}
