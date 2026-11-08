# TESTMAG — Full-Stack интерактивті тест платформасы

## Мүмкіндіктер
- Мұғалім/студент тіркелуі және JWT login
- Қолмен тест құру
- DOCX/TXT импорт және автоматты parsing
- Файл метадеректерін MongoDB-да, файлдың өзін `backend/uploads` ішінде сақтау
- Quizizz стиліндегі тест интерфейсі және таймер
- Дұрыс жауаптарды тек backend тексереді
- Нәтижелер MongoDB-да сақталады
- Teacher: барлық нәтижелер; Student: өзінің тарихы
- Жүктелген файлды қайта жүктеу API-і

## Іске қосу
1. MongoDB орнатыңыз немесе MongoDB Atlas URI алыңыз.
2. `backend/.env.example` файлын `.env` деп көшіріп, мәндерін толтырыңыз.
3. Backend:
```bash
cd backend
npm install
npm run dev
```
4. Frontend (жаңа terminal):
```bash
cd frontend
npm install
npm run dev
```
5. Браузер: `http://localhost:5173`

## Құжат форматы
```text
1. Python дегеніміз не?
A) Операциялық жүйе
B) Бағдарламалау тілі
C) Браузер
Дұрыс жауабы: B

2. HTML не үшін қолданылады?
A) Веб-бет құру
B) Видео өңдеу
Дұрыс жауабы: A
```
Нұсқалар 2–5 аралығында болуы мүмкін.

## Негізгі API
- POST `/api/auth/register`, `/api/auth/login`
- GET `/api/tests`, GET `/api/tests/:id/play`
- POST `/api/tests` (teacher)
- POST `/api/documents/upload` (teacher)
- GET `/api/documents`, GET `/api/documents/:id/download` (teacher)
- POST `/api/results/submit`
- GET `/api/results/history`

## Production ескертпелері
HTTPS, rate limiting, email verification, refresh tokens, S3/Cloudinary тәрізді object storage, MongoDB Atlas, stricter validation және deployment secrets қосу ұсынылады.
