const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const gcs = require('@google-cloud/storage')({keyFilename: 'service-account-credentials.json'});
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
const LIMIT = 40;

exports.memeApproval = functions.https.onCall((data) => {
	const filename = data.id, uid = data.user, timestamp = data.timestamp, website = data.website;
	let x = data.x, y = data.y, size = data.size;
	//firebase bucket
	let bucket = gcs.bucket(admin.storage().bucket().name);
	//new temp file path for the requested image
	const tempFilePath = path.join(os.tmpdir(), filename);
	//new temp file path for the meme-map.png
	const tempMemeMapPath = path.join(os.tmpdir(), 'meme-map.png');
	//new temp file path for the altered location of the thumbnail
	const tempTakenSquarePath = path.join(os.tmpdir(), 'black-square.png');
	//new temp file path for the taken-map.png
	const tempTakenMapPath = path.join(os.tmpdir(), 'taken-map.png');
	//These are not fully needed, but help lower errors
	const smallerNewImage = path.join('added-memes', filename); //'added-memes/filename
	const newmap = path.join('meme-map', 'meme-map.png'); // 'meme-map/meme-map.png'
	const takenMap = path.join('meme-map', 'taken-map.png');// 'meme-map/taken-map.png'
	const takenSquare = path.join('meme-map', 'black-square.png');
	//This is to limit the max size of a photo.
	if(size > LIMIT){
		size = LIMIT;
	}
	//This is to set the x and y to only be multiples of 10.
	// It's in this function so that the user can't edit the javascript itself on their browser
	if(x < 0){
		x = 0;
	} else if (x > 999){
		x = 999
	}
	if(y < 0){
		y = 0;
	} else if(y > 999){
		y = 999;
	}
	x -= x%10;
	y -= y%10;
	if(x + size > 1000){
		x = 1000 - size;
	}
	if(y+size > 1000){
		y = 1000 - size;
	}
	return Promise.all([
		bucket.file(path.join('requested-memes', filename)).getMetadata(),
		bucket.file(newmap).download({destination: tempMemeMapPath}),
		bucket.file(path.join('requested-memes', filename)).download({destination: tempFilePath}),
		bucket.file(takenMap).download({destination: tempTakenMapPath}),
		bucket.file(takenSquare).download({destination: tempTakenSquarePath}),
	]).then((results) => {
		//convert the black square to be the size of the square
		spawn('convert', [tempTakenSquarePath, '-thumbnail', size+'x'+size, tempTakenSquarePath]);
		//Adds the square to the takenMap
		spawn('convert', [tempTakenMapPath, '-page', '+'+x+'+'+y, tempTakenSquarePath, '-flatten', tempTakenMapPath]);
		//convert the file located at the tmpfilepath to a thumbnail of proper size
		spawn('convert', [tempFilePath, '-thumbnail', size+'x'+size, tempFilePath]);
		//Adds the thumbFile to the MemeMap
		spawn('convert', [tempMemeMapPath, '-page', '+'+x+'+'+y, tempFilePath, '-flatten', tempMemeMapPath]);
		return {
			contentType: results[0][0].contentType
		};
	}).then((results)=>{
		return bucket.upload(tempFilePath, {
			destination: smallerNewImage,
			metadata: results
		});
	}).then(()=>{
		return bucket.upload(tempMemeMapPath, {
			destination: newmap
		});
	}).then(()=>{
		return bucket.upload(tempTakenMapPath, {
			destination: takenMap
		});
	}).then(()=>{
		fs.unlinkSync(tempMemeMapPath);
		fs.unlinkSync(tempFilePath);
		fs.unlinkSync(tempTakenMapPath);
		fs.unlinkSync(tempTakenSquarePath);
		const config = {
			action: 'read',
			expires: '03-01-2500'
		};
		return bucket.file(smallerNewImage).getSignedUrl(config);
	}).then((results)=>{
		admin.firestore().collection('users').doc(uid).update({
			[timestamp]: {
				fileLink: results[0],
				sizeOfSquare: size,
				time: timestamp,
				userID: uid,
				website: website,
				x: x,
				y: y
			}
		});
		console.log("added to user data");
		return results;
	}).then((results)=>{
		for(let k = x; k < x+size; k += 10){
			for(let t = y; t < y+size; t += 10){
				admin.firestore().collection('coords').doc(k+','+t).set({
					fileLink: results[0],
					sizeOfSquare: size,
					time: timestamp,
					userID: uid,
					website: website,
					x: k,
					y: t
				});
				console.log("This enters in x:", k, ", y: ", t);
			}
		}
		return {pass:true};
	});
});

exports.whoAmI = functions.https.onCall((data) => {
	console.log("Is: ", data.uid, " an admin?: ", data.uid === "uKDXuRHeldM5omfsEjWhWA5tYpg2");
	return {you:data.uid === "uKDXuRHeldM5omfsEjWhWA5tYpg2"};
});

exports.checkPixels = functions.https.onCall((data) => {
	let x = data.x, y = data.y, size = data.size;
	let pixelsTaken = [];
	for(let i = 0; i < size; ++i){
		for(let j = 0; j < size; ++j){
			pixelsTaken[i * size + j] = (i+x) + "," + (j+y);
		}
	}
	return admin.firestore().collection('coords').where('x', '>=', x).where('x', '<', x+size).get().then((results)=>{
		let check = true;
		results.forEach((doc)=>{
			if(pixelsTaken.includes(doc.id)){
				check = false;
			}
		});
		return {check:check};
	}).catch((error)=>{
		console.error("an error: ", error);
	});
});