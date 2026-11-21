const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const localeDirectory = path.join(__dirname, '..', '..', 'locales');

router.get('/feedback', (req, res) => {
  const supported = { en: 'en-US', fr: 'fr-FR' };
  const lang = Object.prototype.hasOwnProperty.call(supported, req.query.lang) ? req.query.lang : 'en';
  let locale;
  try {
    locale = JSON.parse(fs.readFileSync(path.join(localeDirectory, `${lang}.json`), 'utf8'));
  } catch (_error) {
    locale = JSON.parse(fs.readFileSync(path.join(localeDirectory, 'en.json'), 'utf8'));
  }
  const formattedDate = new Intl.DateTimeFormat(supported[lang]).format(new Date());

  const questions = locale.questions.map((question, index) =>
    `<label for="q${index + 1}">${index + 1}. ${question}</label>
     <textarea id="q${index + 1}" name="q${index + 1}" required></textarea>`
  ).join('\n');

  res.type('html').send(`<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><title>${locale.title}</title></head>
<body>
  <main>
    <h1>${locale.title}</h1>
    <p>${locale.instructions}</p>
    <p><time>${formattedDate}</time></p>
    <form>
      ${questions}
      <button type="submit">${locale.submit}</button>
    </form>
  </main>
</body>
</html>`);
});

module.exports = router;
