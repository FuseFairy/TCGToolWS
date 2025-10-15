const collator = new Intl.Collator(['zh', 'ja', 'en'], {
  sensitivity: 'base',
  numeric: true,
})

export default collator
