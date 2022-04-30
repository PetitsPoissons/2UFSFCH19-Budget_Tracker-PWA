const indexedDB =
	window.indexedDB ||
	window.mozIndexedDB ||
	window.webkitIndexedDB ||
	window.msIndexedDB ||
	window.shimIndexedDB;

// Create variable to hold IndexedDB db connection
let idb_connection;
console.log('idb_connection global variable created', idb_connection);

// Establish a connection to IndexedDB database called 'budget_pwa' and set it to version 1
const budgetPwa_db = indexedDB.open('budget_pwa', 1);

// This event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
budgetPwa_db.onupgradeneeded = function (event) {
	// save a reference to the IndexedDB database
	let idb_ref = event.target.result;
	console.log('budgetPwa_db.onupgradeneeded - idb_ref', event.target.result);
	// create an object store (table) called `pending`, set it to have an auto incrementing primary key of sorts
	idb_ref.createObjectStore('pending', { autoIncrement: true });
};

// Upon a successful
budgetPwa_db.onsuccess = function (event) {
	// when our budget_pwa IndexedDB is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to the budget_pwa IndexedDB in global variable idb_connection
	idb_connection = event.target.result;
	console.log(
		'idb_connection global variable updated when budgetPwa_db.onsuccess triggered',
		idb_connection
	);

	// check if app is online, if yes run uploadRecord() function to send all local IndexedDB data to api
	if (navigator.onLine) {
		uploadRecord();
	}
};

budgetPwa_db.onerror = function (event) {
	// log error here
	console.log('Oh no! Something went wrong!', event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
	console.log('inside saveRecord');
	console.log('record', record);
	// open a new transaction with the database with read and write permissions
	const idbTransaction = idb_connection.transaction(['pending'], 'readwrite');

	// access the object store for `pending`
	const pendingBudgetPwaStore = idbTransaction.objectStore('pending');
	console.log('pendingBudgetPwaStore before add', pendingBudgetPwaStore);

	// add record to your store with add method
	pendingBudgetPwaStore.add(record);
	console.log('pendingBudgetPwaStore after add', pendingBudgetPwaStore);
}

function uploadRecord() {
	console.log('uploadRecord triggered');
	// open a new transaction with the database with read and write permissions
	const idbTransaction = idb_connection.transaction(['pending'], 'readwrite');

	// access the object store for `pending`
	const pendingBudgetPwaStore = idbTransaction.objectStore('pending');

	// get all pending records from pendingBudgetPwaStore
	const getAll = pendingBudgetPwaStore.getAll();
	console.log('getAll pending records', getAll);

	getAll.onsuccess = function () {
		if (getAll.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			})
				.then((res) => res.json())
				.then(() => {
					// delete records from pendingBudgetPwaStore if successful
					// open a new transaction with the database with read and write permissions
					const idbTransaction = idb_connection.transaction(
						['pending'],
						'readwrite'
					);
					// access the object store for `pending`
					const pendingBudgetPwaStore = idbTransaction.objectStore('pending');
					// empty pendingBudgetPwaStore
					pendingBudgetPwaStore.clear();
				})
				.catch((err) => console.log(err));
		}
	};
}

// Listen for app coming back online
window.addEventListener('online', uploadRecord);
