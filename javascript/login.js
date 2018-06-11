var config = {
	apiKey: "AIzaSyCJuD5ep3swJpAbNgDl_ADFEqhyA0025UQ",
	authDomain: "pixelmeme-js.firebaseapp.com",
	databaseURL: "https://pixelmeme-js.firebaseio.com",
	projectId: "pixelmeme-js",
	storageBucket: "pixelmeme-js.appspot.com",
	messagingSenderId: "384650003816"
};

var app = firebase.initializeApp(config);
var db = firebase.firestore(app);
var storage = firebase.storage();


$('#signin').click(function () {
	var email = $('#email').val();
	var password = $('#password').val();
	if (email.length < 4) {
		alert('Please enter an email address.');
		return;
	}
	if (password.length < 4) {
		alert('Please enter a password.');
		return;
	}
	app.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
		var errorCode = error.code;
		var errorMessage = error.message;
		console.log("EC: ", errorCode, " EM: ", errorMessage);
		if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
			alert(errorCode);
		} else {
			alert(errorMessage);
		}
	});
});

$('#signup').click(function () {
	var email = $('#email').val();
	var password = $('#password').val();
	if (email.length < 4) {
		alert('Please enter an email address.');
		return;
	}
	if (password.length < 4) {
		alert('Please enter a password.');
		return;
	}
	app.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
		var errorCode = error.code;
		var errorMessage = error.message;
		if (errorCode === 'auth/weak-password') {
			alert('The password is too weak.');
		} else if(errorCode === 'auth/email-already-in-use'){
			alert('This email is already in use');
		}else {
			alert(errorMessage);
		}
		console.log(error);
	});
});

app.auth().onAuthStateChanged(function (user) {
	if (user) {
		console.log("user signed in!");
		console.log(user.uid);
		var docRef = db.collection("users").doc(user.uid);
		docRef.get().then(function (doc) {
			if (doc.exists) {
				console.log("Document data:", doc.data());
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

