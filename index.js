require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./credentials.json');

const SHEET_ID = process.env.SPREADSHEET_ID;
const SPARE_ROOM_EMAIL = process.env.SPARE_ROOM_EMAIL;
const SPARE_ROOM_PASSWORD = process.env.SPARE_ROOM_PASSWORD;

(async () => {
  // Connect to Google Sheet
  const doc = new GoogleSpreadsheet(SHEET_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Log in to SpareRoom
  await page.goto('https://www.spareroom.co.uk/flatshare/my_account.pl?action=login');
  await page.type('#loginemail', SPARE_ROOM_EMAIL);
  await page.type('#loginpassword', SPARE_ROOM_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  // Loop through sheet and post listings
  for (let row of rows) {
    if (row['Post to SpareRoom'] !== 'TRUE' || row['Posted (Y/N)'] === 'YES') continue;

    try {
      console.log(`Posting: ${row['Property Title']}...`);
      await page.goto('https://www.spareroom.co.uk/flatshare/my_account.pl?action=manage_ad');
      await page.waitForSelector('input[name="ad_title"]');

      await page.type('input[name="ad_title"]', row['Property Title']);
      await page.type('textarea[name="ad_description"]', row['Description']);
      await page.type('input[name="ad_postcode"]', row['Postcode']);
      await page.type('input[name="ad_rent_amount"]', row['Weekly Rent (£)'].toString());
      await page.type('input[name="ad_deposit_amount"]', row['Deposit (£)'].toString());

      // Example: Handling optional checkboxes (update selectors as needed)
      if (row['Furnished'] === 'TRUE') {
        await page.click('input[value="furnished"]');
      }
      if (row['Bills Included'] === 'TRUE') {
        await page.click('#bills_included');
      }

      // Upload image: Download then upload (if Image URL exists)
      if (row['Image URL']) {
        const viewSource = await page.goto(row['Image URL']);
        const filePath = './temp-image.jpg';
        fs.writeFileSync(filePath, await viewSource.buffer());
        const uploadInput = await page.$('input[type="file"]');
        await uploadInput.uploadFile(filePath);
      }

      // Submit the ad
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation(),
      ]);

      row['Posted (Y/N)'] = 'YES';
      await row.save();
      console.log(`Posted: ${row['Property Title']}`);
    } catch (err) {
      console.error(`Error posting ${row['Property Title']}: ${err.message}`);
    }
  }
  await browser.close();
})();
