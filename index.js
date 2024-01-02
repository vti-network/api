const express = require('express');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = 3000;

// Objek untuk menyimpan hash yang sudah di-generate
const generatedHashes = {};

// Nama file untuk menyimpan data
const dbFilePath = './db/json/db-address.json';

// Membaca data dari file (jika file sudah ada)
let data = [];
try {
    const fileContent = fs.readFileSync(dbFilePath, 'utf8');
    data = JSON.parse(fileContent);
} catch (error) {
    // File belum ada atau gagal dibaca, data tetap kosong
}

// Endpoint untuk membuat hash
app.get('/gaddress/:email/:password', (req, res) => {
    const { email, password } = req.params;

    // Pengecekan apakah email sudah pernah di-generate
    const existingHashEntry = data.find(entry => entry.email === email);
    if (existingHashEntry) {
        const existingHash = existingHashEntry.generatedHash;
        res.send(`Hash sudah di-generate sebelumnya: ${existingHash}`);
        return;
    }

    // Mengecek apakah kombinasi email dan password sudah di-generate sebelumnya
    const existingHash = generatedHashes[`${email}:${password}`];
    if (existingHash) {
        res.send(`Hash sudah di-generate sebelumnya: ${existingHash}`);
        return;
    }

    // Generate a random secret key
    const secretKey = crypto.randomBytes(32).toString('hex');

    // Combine email, password, dan secret key
    const combinedString = `${email}:${password}:${secretKey}`;

    // Membuat hash menggunakan SHA256
    const hash = crypto.createHash('sha256').update(combinedString).digest('hex');

    // Menyimpan hash yang sudah di-generate
    generatedHashes[`${email}:${password}`] = hash;

//history

const hs = {
    acc_created: [
        {
            date_time: getDateTimeNow()
        }
    ]
    ,
    acc_send:[],
    acc_receive: [],
    acc_deposit: [],
    acc_convert:[],

};

// Menyimpan data ke dalam array
const newData = {
    email,
    password,
    generatedHash: hash,
    secretKey,
    balance: [
        {
            IDR: "0",
            VTI: "0"
        }
    ],
    history: hs
};

data.push(newData);



    // Menyimpan data ke dalam file
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');

    res.send(`Generated hash: ${hash}, Secret Key: ${secretKey}`);
    console.log(newData);
});

//CRUD READ ADDRESS
// Endpoint for retrieving data based on secretKey
app.get('/getaddress/:secretKey', (req, res) => {
    const { secretKey } = req.params;

    // Read data from the file
    let data = [];
    try {
        const fileContent = fs.readFileSync(dbFilePath, 'utf8');
        data = JSON.parse(fileContent);
    } catch (error) {
        // Handle file reading error, if any
        res.status(500).send('Internal Server Error');
        return;
    }

    // Find data based on secretKey
    const foundData = data.find(entry => entry.secretKey === secretKey);

    if (foundData) {
        // If data is found, send data as the response
        res.json(foundData);
    } else {
        // If data is not found, send a 404 response
        res.status(404).send('Data not found');
    }
});

//add uang
//app.get('/addmoney/:secretKey/:adminKey/IDR/:idrAmount/VTI/:vtiAmount', (req, res) => {
    //const { secretKey, adminKey, idrAmount, vtiAmount } = req.params;
app.get('/addmoney/:secretKey/:adminKey/IDR/:idrAmount', (req, res) => {
        const { secretKey, adminKey, idrAmount } = req.params;
    
        // Verify the adminKey
        if (adminKey !== 'kode12345' && adminKey !== '09121991') {
            res.status(403).send('Unauthorized: Invalid admin key');
            return;
        }
    
        // Read data from the file
        let data = [];
        try {
            const fileContent = fs.readFileSync(dbFilePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            // Handle file reading error, if any
            res.status(500).send('Internal Server Error');
            return;
        }
    
        // Find data based on secretKey
        const foundDataIndex = data.findIndex(entry => entry.secretKey === secretKey);
    
        if (foundDataIndex !== -1) {
            // If data is found, update the balance
            data[foundDataIndex].balance[0].IDR = (parseInt(data[foundDataIndex].balance[0].IDR) + parseInt(idrAmount)).toString();
    
            // Create the hs object and add it to the data
            const hs = {
                date_time: getDateTimeNow(), // Pastikan getDateTimeNow telah didefinisikan
                IDR: idrAmount
            };
    
            // Pastikan history dan acc_deposit sudah didefinisikan sebagai array
            if (!data[foundDataIndex].history) {
                data[foundDataIndex].history = { acc_deposit: [] };
            }
    
            data[foundDataIndex].history.acc_deposit.push(hs);
    
            // Update the file with the modified data
            fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
    
            // Respond with the updated data
            res.json(data[foundDataIndex]);
        } else {
            // If data is not found, send a 404 response
            res.status(404).send('Data not found');
        }
});
    
//convert IDR TO VTI
app.get('/convert/:secretKey/IDR/:idrAmount/VTI', (req, res) => {
    const { secretKey, idrAmount } = req.params;

    // Read data from the file
    let data = [];
    try {
        const fileContent = fs.readFileSync(dbFilePath, 'utf8');
        data = JSON.parse(fileContent);
    } catch (error) {
        // Handle file reading error, if any
        res.status(500).send('Internal Server Error');
        return;
    }

    // Find data based on secretKey
    const foundDataIndex = data.findIndex(entry => entry.secretKey === secretKey);

    if (foundDataIndex !== -1) {
        // If data is found, convert IDR to VTI with a fee
        const gasFee = 1000; // Gas fee for the conversion
        const convertedAmount = parseInt(idrAmount) - gasFee; // Deduct gas fee

        // Check if the user has enough balance in IDR
        if (parseInt(data[foundDataIndex].balance[0].IDR) < parseInt(idrAmount)) {
            res.status(400).send('Insufficient balance in IDR');
            return;
        }

        // Update the balance
        data[foundDataIndex].balance[0].IDR = (parseInt(data[foundDataIndex].balance[0].IDR) - parseInt(idrAmount)).toString();
        data[foundDataIndex].balance[0].VTI = (parseInt(data[foundDataIndex].balance[0].VTI) + convertedAmount).toString();

        // Create the hs object for conversion and add it to the data
        const hs = {
            date_time: getDateTimeNow(),
            IDR: idrAmount,
            To: 'VTI',
            Gass: gasFee,
            Total:`VTI balance ${convertedAmount}`
        };

        if (!data[foundDataIndex].history) {
            data[foundDataIndex].history = { acc_convert: [] };
        }

        data[foundDataIndex].history.acc_convert.push(hs);

        // Update the file with the modified data
        fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');

        // Respond with the updated data
        res.json(data[foundDataIndex]);
    } else {
        // If data is not found, send a 404 response
        res.status(404).send('Data not found');
    }
});


//convert VTI TO IDR
app.get('/convert/:secretKey/VTI/:vtiAmount/IDR', (req, res) => {
    const { secretKey, vtiAmount } = req.params;

    // Read data from the file
    let data = [];
    try {
        const fileContent = fs.readFileSync(dbFilePath, 'utf8');
        data = JSON.parse(fileContent);
    } catch (error) {
        // Handle file reading error, if any
        res.status(500).send('Internal Server Error');
        return;
    }

    // Find data based on secretKey
    const foundDataIndex = data.findIndex(entry => entry.secretKey === secretKey);

    if (foundDataIndex !== -1) {
        // If data is found, convert VTI to IDR with a fee
        const gasFee = 500; // Gas fee for the conversion
        const convertedAmount = parseInt(vtiAmount) - gasFee;

        // Check if the user has enough balance in VTI
        if (parseInt(data[foundDataIndex].balance[0].VTI) < parseInt(vtiAmount)) {
            res.status(400).send('Insufficient balance in VTI');
            return;
        }

        // Update the balance
        data[foundDataIndex].balance[0].VTI = (parseInt(data[foundDataIndex].balance[0].VTI) - parseInt(vtiAmount)).toString();
        data[foundDataIndex].balance[0].IDR = (parseInt(data[foundDataIndex].balance[0].IDR) + convertedAmount).toString();
       
        const hs = {
            date_time: getDateTimeNow(),
            VTI: vtiAmount,
            To: 'IDR',
            Gass: gasFee,
            Total:`IDR balance ${convertedAmount}`
        };

        if (!data[foundDataIndex].history) {
            data[foundDataIndex].history = { acc_convert: [] };
        }

        data[foundDataIndex].history.acc_convert.push(hs);
        // Update the file with the modified data
        fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');

        // Respond with the updated data
        res.json(data[foundDataIndex]);
    } else {
        // If data is not found, send a 404 response
        res.status(404).send('Data not found');
    }
});

//kirim sesama addr
app.get('/send/:secretKey/:currency/:value/:secretKeyOther', (req, res) => {
    const { secretKey, currency, value, secretKeyOther } = req.params;

    // Read data from the file
    let data = [];
    try {
        const fileContent = fs.readFileSync(dbFilePath, 'utf8');
        data = JSON.parse(fileContent);
    } catch (error) {
        // Handle file reading error, if any
        res.status(500).send('Internal Server Error');
        return;
    }

    // Find data based on secretKey
    const senderIndex = data.findIndex(entry => entry.secretKey === secretKey);

    if (senderIndex !== -1) {
        // Check if the sender has enough balance in the specified currency
        if (parseInt(data[senderIndex].balance[0][currency]) < parseInt(value)) {
            res.status(400).send(`Insufficient balance in ${currency}`);
            return;
        }

        // Find data based on secretKeyOther
        const receiverIndex = data.findIndex(entry => entry.secretKey === secretKeyOther);

        if (receiverIndex !== -1) {
            // Update the balance for the sender
            data[senderIndex].balance[0][currency] = (parseInt(data[senderIndex].balance[0][currency]) - parseInt(value)).toString();

            // Update the balance for the receiver
            data[receiverIndex].balance[0][currency] = (parseInt(data[receiverIndex].balance[0][currency]) + parseInt(value)).toString();

            // Create the hs object for the transaction and add it to the sender's history
            const hsSender = {
                date_time: getDateTimeNow(),
                currency,
                value,
                TO: secretKeyOther
            };

            if (!data[senderIndex].history) {
                data[senderIndex].history = { acc_send: [] };
            }

            data[senderIndex].history.acc_send.push(hsSender);

            // Create the hs object for the transaction and add it to the receiver's history
            const hsReceiver = {
                date_time: getDateTimeNow(),
                currency,
                value,
                FROM: secretKey
            };

            if (!data[receiverIndex].history) {
                data[receiverIndex].history = { acc_receive: [] };
            }

            data[receiverIndex].history.acc_receive.push(hsReceiver);

            // Update the file with the modified data
            fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');

            // Respond with the updated data for the sender
            res.json(data[senderIndex]);
        } else {
            // If receiver data is not found, send a 404 response
            res.status(404).send('Receiver data not found');
        }
    } else {
        // If sender data is not found, send a 404 response
        res.status(404).send('Sender data not found');
    }
});


// Endpoint untuk memulihkan email dan password dari hash masih eror
app.get('/recovery/:hash/:key', (req, res) => {
    const { hash, key } = req.params;

    // Menggunakan kunci yang diberikan untuk membuat instance decipher
    const decipher = crypto.createDecipher('aes-256-cbc', key);

    try {
        const reversedString = decipher.update(hash, 'hex', 'utf8') + decipher.final('utf8');
        const [email, password, secretKey] = reversedString.split(':');
        res.send(`Decoded email: ${email}, Decoded password: ${password}, Secret Key: ${secretKey}`);
    } catch (error) {
        res.status(500).send('Gagal mengembalikan hash.');
    }
});

app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});

//
function getDateTimeNow() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Example usage
const currentDateTime = getDateTimeNow();
console.log(currentDateTime);
