module.exports = {
  input: [
    'components/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['i18n.t', 't'],
      extensions: ['.ts', '.tsx'],
    },
    lngs: ['en', 'es'],
    ns: ['translation'],
    defaultLng: 'en',
    defaultNs: 'translation',
    defaultValue: (lng, _ns, key) => {
      if (lng === 'en') {
        return key;
      }

      return '__STRING_NOT_TRANSLATED__';
    },
    resource: {
      loadPath: 'i18n/{{lng}}/{{ns}}.json',
      savePath: 'i18n/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    nsSeparator: false,
    keySeparator: false,
    removeUnusedKeys: true,
  },
};
