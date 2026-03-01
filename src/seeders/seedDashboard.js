/**
 * seeders/seedDashboard.js
 *
 * Run: node seeders/seedDashboard.js
 *
 * This script will:
 *  - insert 50 cities
 *  - insert categories + subcategories
 *  - (optional) create two sample organizers, two sample events and event media
 *
 * It uses models from src/models/index.js (Sequelize).
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const possibleModelPaths = [
  path.resolve(__dirname, '..', 'models'),             
  path.resolve(__dirname, '..', 'config', 'models')    
];

let modelsDir = null;
let modelsIndex = null;
for (const p of possibleModelPaths) {
  const idx = path.join(p, 'index.js');
  if (fs.existsSync(idx)) {
    modelsDir = p;
    modelsIndex = idx;
    break;
  }
}

console.log('DEBUG: seeder __dirname =', __dirname);
console.log('DEBUG: checked model locations:', possibleModelPaths.join(' , '));
if (!modelsDir) {
  console.error('FATAL: Could not find models index in either of the expected locations.');
  console.error('Please create src/models/index.js or src/config/models/index.js.');
  console.error('Checked paths:');
  possibleModelPaths.forEach(p => console.error('  -', p));
  process.exit(1);
}

console.log('DEBUG: using models at:', modelsDir, '(index:', modelsIndex, ')');

// Try to require the models module
let db;
try {
  // remove cache if re-running in same Node process
  try { delete require.cache[require.resolve(modelsIndex)]; } catch (e) {}
  db = require(modelsDir); // require the folder, Node resolves index.js
} catch (err) {
  console.error('FATAL: Error requiring models from', modelsDir);
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}

const { City, Category, Subcategory, User, Event, EventMedia } = db;

// sanity checks
if (!db || !db.sequelize) {
  console.error('FATAL: loaded module does not export sequelize instance. Exports:', Object.keys(db));
  process.exit(1);
}
if (!City || !Category || !Subcategory) {
  console.error('FATAL: required models not exported from src/models/index.js. Exports:', Object.keys(db));
  process.exit(1);
}

async function seed() {
  console.log('Starting seeder...');
  const t = await db.sequelize.transaction();
  try {
    // 1) Cities (50)
    const cities = [
      'Mumbai','Delhi','Bengaluru','Hyderabad','Ahmedabad','Chennai','Kolkata','Surat','Pune','Jaipur',
      'Lucknow','Kanpur','Nagpur','Indore','Thane','Bhopal','Visakhapatnam','Pimpri-Chinchwad','Patna','Vadodara',
      'Ghaziabad','Ludhiana','Agra','Nashik','Faridabad','Meerut','Rajkot','Kalyan-Dombivli','Vasai-Virar','Varanasi',
      'Srinagar','Aurangabad','Dhanbad','Amritsar','Navi Mumbai','Prayagraj','Ranchi','Howrah','Coimbatore','Jabalpur',
      'Gwalior','Vijayawada','Madurai','Raipur','Kota','Guwahati','Chandigarh','Solapur','Hubli-Dharwad','Bareilly'
    ];

    const cityPromises = cities.map(name => {
      const slug = name.toLowerCase().replace(/[\s&/]+/g, '-').replace(/[^\w-]+/g, '');
      return City.findOrCreate({
        where: { name },
        defaults: { name, state: null, country: 'India', slug },
        transaction: t
      });
    });
    await Promise.all(cityPromises);
    console.log('✅ Cities seeded (50)');

    // 2) Categories & Subcategories (matching your list)
    const categoriesWithSubs = [
      { name: 'Social', emoji: '🎉', subs: ['Birthdays','Family','Friends','Coffee/Tea','Community','Reunions','Networking'] },
      { name: 'Fun', emoji: '🎶', subs: ['Concerts','Movies','Comedy','DJ Nights','Karaoke','Talent','Open Mic'] },
      { name: 'Learn', emoji: '📚', subs: ['Workshops','Talks','Book Club','Startups','Motivation','Tech Meet','Careers'] },
      { name: 'Food', emoji: '🍔', subs: ['Festivals','Cafes','Street Eats','Tastings','Cooking','Farmers’','Pop-ups'] },
      { name: 'Active', emoji: '⚽', subs: ['Matches','Marathon','Yoga','Treks','Adventure','Kids Sports','Senior Fit'] },
      { name: 'Culture', emoji: '🎨', subs: ['Art Shows','Dance/Music','Spiritual','Fairs','Photography','Theatre','Crafts'] },
      { name: 'Biz', emoji: '💼', subs: ['Networking','Expos','Startup','Career Fair','Hackathons','Summits','Launches'] },
      { name: 'Lifestyle', emoji: '💖', subs: ['Charity','Pets','Gardening','Women’s','Seniors','Fashion','Wellness'] }
    ];

    for (let i = 0; i < categoriesWithSubs.length; i++) {
      const c = categoriesWithSubs[i];
      const [category] = await Category.findOrCreate({
        where: { name: c.name },
        defaults: { name: c.name, emoji: c.emoji, order_index: i+1, is_default: i === 0 },
        transaction: t
      });

      // create subcategories
      for (const subName of c.subs) {
        await Subcategory.findOrCreate({
          where: { category_id: category.id, name: subName },
          defaults: { category_id: category.id, name: subName },
          transaction: t
        });
      }
    }
    console.log('✅ Categories + subcategories seeded');

    // 3) Optional: create two sample organizers, two events and media so dashboard isn't empty
    // Create sample users (organizers)
    const [org1] = await User.findOrCreate({
      where: { email: 'org1@evntra.local' },
      defaults: { name: 'Organizer One', email: 'org1@evntra.local', avatar_url: null },
      transaction: t
    });
    const [org2] = await User.findOrCreate({
      where: { email: 'org2@evntra.local' },
      defaults: { name: 'Organizer Two', email: 'org2@evntra.local', avatar_url: null },
      transaction: t
    });

    // find a city id for Pune (if present)
    const pune = await City.findOne({ where: { name: 'Pune' }, transaction: t });
    const mumbai = await City.findOne({ where: { name: 'Mumbai' }, transaction: t });
    const puneId = pune ? pune.id : null;
    const mumbaiId = mumbai ? mumbai.id : null;

    // Create two sample events
    const [ev1] = await Event.findOrCreate({
      where: { title: 'Pune Open Mic Night' },
      defaults: {
        organizer_id: org1.id,
        title: 'Pune Open Mic Night',
        description: 'Open mic where local talent performs — comedy, music, poetry.',
        city_id: puneId,
        venue_name: 'The Taproom',
        address: 'FC Road, Pune',
        lat: 18.5204,
        lng: 73.8567,
        price: 0,
        is_free: true,
        start_time: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 1 week from now
        end_time: new Date(Date.now() + 7 * 24 * 3600 * 1000 + 3 * 3600 * 1000), // +3 hours
        status: 'published'
      },
      transaction: t
    });

    const [ev2] = await Event.findOrCreate({
      where: { title: 'Mumbai Street Food Fest' },
      defaults: {
        organizer_id: org2.id,
        title: 'Mumbai Street Food Fest',
        description: 'Tasting extravaganza of Mumbai street-food vendors.',
        city_id: mumbaiId,
        venue_name: 'Marine Drive',
        address: 'Marine Drive, Mumbai',
        lat: 18.9430,
        lng: 72.8235,
        price: 199,
        is_free: false,
        start_time: new Date(Date.now() + 14 * 24 * 3600 * 1000), // 2 weeks from now
        end_time: new Date(Date.now() + 14 * 24 * 3600 * 1000 + 8 * 3600 * 1000), // +8 hours
        status: 'published'
      },
      transaction: t
    });

    // Attach sample media (images) — these are example URLs; replace with real CDN URLs in prod
    await EventMedia.findOrCreate({
      where: { event_id: ev1.id, url: 'https://example.com/media/openmic_card.jpg' },
      defaults: { event_id: ev1.id, media_type: 'image', url: 'https://example.com/media/openmic_card.jpg', order_index: 1, width: 360, height: 200 },
      transaction: t
    });

    await EventMedia.findOrCreate({
      where: { event_id: ev2.id, url: 'https://example.com/media/foodfest.jpg' },
      defaults: { event_id: ev2.id, media_type: 'image', url: 'https://example.com/media/foodfest.jpg', order_index: 1, width: 360, height: 200 },
      transaction: t
    });

    console.log('✅ Sample events + media created');

    await t.commit();
    console.log('Seeder complete ✅');
    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err);
    await t.rollback();
    process.exit(1);
  }
}

seed();
