const SEASONS = [
  { months: [12, 1, 2], label: 'Winter' },
  { months: [3, 4, 5], label: 'Spring' },
  { months: [6, 7, 8], label: 'Summer' },
  { months: [9, 10, 11], label: 'Autumn' },
];

const DAY_MOODS: Record<string, string[]> = {
  morning: ['Morning Light', 'Dawn', 'Sunrise', 'Early'],
  afternoon: ['Golden Hour', 'Afternoon', 'Sunlit', 'Warm'],
  evening: ['Dusk', 'Evening Glow', 'Twilight', 'Sunset'],
  night: ['Night', 'Starlit', 'Midnight', 'Moonlit'],
};

const FALLBACK_TITLES = [
  'A Day to Remember',
  'Cherished Moments',
  'Beautiful Memory',
  'Precious Time',
  'Heartfelt',
  'Simply Beautiful',
  'Treasured',
  'Worth Remembering',
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getSeason(month: number): string {
  const season = SEASONS.find(s => s.months.includes(month));
  return season?.label || '';
}

function getDayMood(hour: number): string {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function generateMemoryTitle(location?: string, date?: Date): string {
  const now = date || new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const hour = now.getHours();
  const monthName = MONTH_NAMES[month];
  const season = getSeason(month + 1);
  const mood = getDayMood(hour);
  const moodWords = DAY_MOODS[mood];

  const hasLocation = location && location.length > 0 && location !== 'Unknown';

  // Location-based titles (most emotional)
  if (hasLocation) {
    const parts = location.split(',').map(s => s.trim());
    const primary = parts[0];

    // "Summer in Kyoto", "Winter in Paris"
    if (season) {
      return `${season} in ${primary}`;
    }

    // "Night in Mumbai", "Morning in Tokyo"
    const randomMood = moodWords[day % moodWords.length];
    return `${randomMood} in ${primary}`;
  }

  // Date-based titles
  const suffix = getDaySuffix(day);

  // "Sunday Memories"
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[now.getDay()];
  if (day % 2 === 0) {
    return `${dayName} Memories`;
  }

  // "December in Paris" — but no location, so "December Evening"
  if (season) {
    const randomMood = moodWords[month % moodWords.length];
    return `${monthName} ${randomMood}`;
  }

  // Fallback
  return FALLBACK_TITLES[day % FALLBACK_TITLES.length];
}

export function extractExifDate(exif: Record<string, any> | null | undefined): Date | null {
  if (!exif) return null;

  // Try DateTimeOriginal (most common EXIF date field)
  const rawDate = exif.DateTimeOriginal || exif.DateTime || exif['{Exif}DateTimeOriginal'] || exif['{Exif}DateTime'];

  if (rawDate && typeof rawDate === 'string') {
    // Format: "YYYY:MM:DD HH:MM:SS"
    const parts = rawDate.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (parts) {
      const parsed = new Date(
        parseInt(parts[1]),
        parseInt(parts[2]) - 1,
        parseInt(parts[3]),
        parseInt(parts[4]),
        parseInt(parts[5]),
        parseInt(parts[6]),
      );
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  // Fallback: try GPSDateStamp or OffsetTimeOriginal
  const gpsDate = exif.GPSDateStamp;
  if (gpsDate && typeof gpsDate === 'string') {
    const parsed = new Date(gpsDate.replace(/:/g, '-'));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function extractExifLocation(exif: Record<string, any> | null | undefined): { latitude?: number; longitude?: number } {
  if (!exif) return {};

  let latitude = exif.GPSLatitude;
  let longitude = exif.GPSLongitude;

  // Handle image-picker EXIF format where coordinates may be nested
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return { latitude, longitude };
  }

  return {};
}
