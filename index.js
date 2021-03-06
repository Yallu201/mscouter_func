// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const serviceAccount = require('./secret/serviceAccountKey');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://musinsa-scouter.firebaseio.com',
});
const database = admin.database();

const getTodayDateString = require('./libs/date');
const { start } = require('./libs/products');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.dailyCrawling = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async context => {
    const dateString = getTodayDateString();
    const param = {
      pageStart: 1,
      pageLast: 11,
      delay: 0,
      displayCnt: 100,
      dateString,
    };
    const products = await start(param);
    console.log('Crawling success with ', products.length, ' products');
    let updates = {};
    updates[`ranking/${dateString}`] = products;
    await database.ref().update(updates);
    console.log('Update DB success');
  });

exports.updateProductsOnCreate = functions.database
  .ref(`/ranking/{dateString}`)
  .onCreate((snapshot, context) => {
    const dateString = getTodayDateString();
    const ranking = snapshot.val();
    ranking.forEach(async p => {
      const { rank, brand, brandEN, name, price, img, serialNo } = p;
      const ref = database.ref(`products/${serialNo}`);
      const snapshot = await ref.once('value');
      const product = snapshot.val();

      if (product) {
        await database.ref(`products/${serialNo}/calendar/${dateString}`).update({ rank, price });
      } else {
        await database.ref(`products/${serialNo}`).set({
          brand,
          brandEN,
          name,
          img,
          calendar: { [dateString]: { rank, price } },
        });
      }
    });
  });

exports.updateBrandsOnCreate = functions.database
  .ref(`/ranking/{dateString}`)
  .onCreate((snapshot, context) => {
    const ranking = snapshot.val();
    ranking.forEach(async p => {
      const { brand, brandEN } = p;
      const ref = database.ref(`brands/${brandEN}`);
      const snapshot = await ref.once('value');
      const item = snapshot.val();
      if (!item) {
        await database.ref(`brands/${brandEN}`).set({
          brand,
          brandEN,
          search: 0,
        });
      }
    });
  });

// function getUpdates(products, dateString) {
//   return new Promise((resolve, reject) => {
//     try {
//       let updates = {};
//       products.forEach(async p => {
//         const { rank, brand, name, price, img, serialNo } = p;
//         const snapshot = await database.ref(`products/${serialNo}`).once('value');
//         const product = snapshot.val();

//         if (product) {
//           // Add price data
//           updates[`products/${serialNo}/calendar/${dateString}`] = { rank, price };
//         } else {
//           // Insert product
//           await database.ref(`products/${serialNo}`).set({
//             brand,
//             name,
//             img,
//             calendar: { [dateString]: { rank, price } },
//           });
//         }
//       });
//       resolve(updates);
//     } catch (e) {
//       console.log(e);
//       reject(e);
//     }
//   });
// }
