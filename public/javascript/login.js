let config = {
	apiKey: "AIzaSyCJuD5ep3swJpAbNgDl_ADFEqhyA0025UQ",
	authDomain: "pixelmeme-js.firebaseapp.com",
	databaseURL: "https://pixelmeme-js.firebaseio.com",
	projectId: "pixelmeme-js",
	storageBucket: "pixelmeme-js.appspot.com",
	messagingSenderId: "384650003816"
};

let app = firebase.initializeApp(config);
let db = firebase.firestore(app);
let storage = firebase.storage();


$('#signin').click(function () {
	let email = $('#email').val();
	let password = $('#password').val();
	if (email.length < 4) {
		alert('Please enter an email address.');
		return;
	}
	if (password.length < 4) {
		alert('Please enter a password.');
		return;
	}
	app.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
		console.log("EC: ", error.code, " EM: ", error.message);
		if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
			alert(error.code);
		} else {
			alert(error.message);
		}
	});
});

$('#signup').click(function () {
	let email = $('#email').val();
	let password = $('#password').val();
	if (email.length < 4) {
		alert('Please enter an email address.');
		return;
	}
	if (password.length < 4) {
		alert('Please enter a password.');
		return;
	}
	app.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
		if (error.code === 'auth/weak-password') {
			alert('The password is too weak.');
		} else if(error.code === 'auth/email-already-in-use'){
			alert('This email is already in use');
		}else {
			alert(error.message);
		}
		console.log(error);
	});
});

app.auth().onAuthStateChanged(function (user) {
	if (user) {
		console.log(user.uid, " signed in!");
		db.collection("users").doc(user.uid).get().then(function (doc) {
			if (doc.exists) {
				window.location.replace("index.html");
			} else {
				console.log("No such document!");
				console.log("Making document!");
				db.collection("users").doc(user.uid).set({
					uid: user.uid,
					userEmail: user.email,
					displayName: user.displayName
				}).then(function () {
					window.location.replace("index.html");
				});
			}
		}).catch(function (error) {
			console.log("Error occured:", error);
		});

	}
});

