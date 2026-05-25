export interface ExifData {
  dateTaken?: string;
  latitude?: number;
  longitude?: number;
}

export interface Ticket {
  id: string;
  photoUri: string;
  thumbnailUri?: string;
  title: string;
  note: string;
  location: string;
  date: string;
  category: string;
  format: string;
  timestamp: number;
  createdAt: string;
}
