const supabase = require('../src/config/database');

(async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log('DATA:', data);
    console.log('ERROR:', error);
  } catch (err) {
    console.error('EXCEPTION', err.message, err);
  }
})();
