document.addEventListener("DOMContentLoaded", function(){

// ---------------- SIGNUP ----------------
const signupForm = document.getElementById("signupForm");

if(signupForm){

signupForm.addEventListener("submit", async function(e){

e.preventDefault();

const name = document.getElementById("name").value;
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

const response = await fetch("http://localhost:5000/signup",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name:name,
email:email,
password:password
})
});

const data = await response.json();

document.getElementById("message").innerText = data.message;

if(data.message === "Signup successful"){

setTimeout(()=>{
window.location.href="login.html";
},1000);

}

}catch(err){

document.getElementById("message").innerText="Error connecting to server";
console.error(err);

}

});

}



// ---------------- LOGIN ----------------
const loginForm = document.getElementById("loginForm");

if(loginForm){

loginForm.addEventListener("submit", async function(e){

e.preventDefault();

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

const response = await fetch("http://localhost:5000/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email:email,
password:password
})
});

const data = await response.json();

document.getElementById("loginMessage").innerText = data.message;

if(data.message === "Login successful"){

// save user data
localStorage.setItem("userEmail", data.email);
localStorage.setItem("userName", data.name);
localStorage.setItem("userRole", data.role);


// if ADMIN login
if(data.role === "admin"){

localStorage.setItem("adminEmail", data.email);
localStorage.setItem("adminName", data.name);

setTimeout(()=>{
window.location.href="admin-dashboard.html";
},800);

}

// normal USER login
else{

setTimeout(()=>{
window.location.href="dashboard.html";
},800);

}

}

}catch(err){

document.getElementById("loginMessage").innerText="Error connecting to server";
console.error(err);

}

});

}

});