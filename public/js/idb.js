// variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open("BudgetTracker", 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  db.createObjectStore("BudgetTracker", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadBudget() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new expense and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["BudgetTracker"], "readwrite");

  // access the object store for `BudgetTracker`
  const BudgetTrackerObjectStore = transaction.objectStore("BudgetTracker");

  // add record to your store with add method
  BudgetTrackerObjectStore.add(record);
}

function uploadBudget() {
  // open a transaction on your db
  const transaction = db.transaction(["BudgetTracker"], "readwrite");

  // access your object store
  const BudgetTrackerObjectStore = transaction.objectStore("BudgetTracker");

  // get all records from store and set to a variable
  const getAll = BudgetTrackerObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["BudgetTracker"], "readwrite");
          // access the BudgetTracker object store
          const BudgetTrackerObjectStore =
            transaction.objectStore("BudgetTracker");
          // clear all items in your store
          BudgetTrackerObjectStore.clear();

          alert("All saved expenses have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadBudget);