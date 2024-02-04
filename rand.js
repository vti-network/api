var fs = require('fs');
var uang = JSON.parse(fs.readFileSync('./uang.json', 'utf8'));

var bet = 1;
var x = 1;
var b = 0;

function nomorAcak() {
    return Math.floor(Math.random() * 10) + 1;
}

function big() {
    b = bet * 10;
}
function lite() {
    b = bet * 1;
}

(function () {
console.log(`uang:${uang.uang}`)
console.log(`jumlah bet = ${bet}`)
    for (var i = 0; i < x; i++) {
        var hasilAcak = nomorAcak();
    console.log("bet ke " + (i + 1) + " = " + hasilAcak);

        if (hasilAcak === 1) {
            console.log("Menang!");
            uang.uang += bet;
        } else if (hasilAcak === 9) {
            console.log("mega win");
            big();
            uang.uang += bet + b;
        } else if (hasilAcak === 8) {
            console.log("big win");
            lite();
            uang.uang += bet + b;
        } else if (hasilAcak === 7) {
            console.log("big win");
            lite();
            uang.uang += bet + b;
        } else if (hasilAcak === 6) {
            console.log("big win");
            lite();
            uang.uang += bet + b;
        } else if (hasilAcak === 5) {
            console.log("big win");
            lite();
            uang.uang += bet + b;
        } else {
            console.log("Kalah! bro depo lagi");
            uang.uang -= bet;
        }
    }
console.log(`Sisa uang = ${uang.uang}`);
    fs.writeFileSync('./uang.json', JSON.stringify(uang));
})();
