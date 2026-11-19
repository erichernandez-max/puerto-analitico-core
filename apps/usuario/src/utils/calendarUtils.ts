/**
 * Utilidades para integración con Google Calendar y calendarios estándar (.ics).
 */

export interface CalendarEventData {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // formato "YYYY-MM-DD HH:mm:ss" o ISO
  endDate: string;   // formato "YYYY-MM-DD HH:mm:ss" o ISO
}

/**
 * Genera la URL oficial de Google Calendar Render para agregar un evento con un solo clic.
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  // Limpiar y formatear las fechas a formato YYYYMMDDTHHmmss
  const formatGCalDate = (dateStr: string): string => {
    return dateStr.replace(/[-:]/g, '').replace(' ', 'T').slice(0, 15);
  };

  const dates = `${formatGCalDate(event.startDate)}/${formatGCalDate(event.endDate)}`;
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', event.title);
  url.searchParams.set('dates', dates);
  if (event.description) {
    url.searchParams.set('details', event.description);
  }
  if (event.location) {
    url.searchParams.set('location', event.location);
  }
  url.searchParams.set('ctz', 'America/Mexico_City');

  return url.toString();
}

/**
 * Genera y descarga un archivo .ics estándar para Apple Calendar, Outlook u otras apps.
 */
export function downloadIcsFile(event: CalendarEventData, fileName?: string): void {
  const formatIcsDate = (dateStr: string): string => {
    return dateStr.replace(/[-:]/g, '').replace(' ', 'T').slice(0, 15);
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Puerto Analitico//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title.replace(/[\r\n]+/g, ' ')}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    `DTSTART;TZID=America/Mexico_City:${formatIcsDate(event.startDate)}`,
    `DTEND;TZID=America/Mexico_City:${formatIcsDate(event.endDate)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName || 'reserva-puerto-analitico.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
