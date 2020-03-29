// Module object to export
const module = {}

/**
 * Get local storage values by key
 * @param {string} key The storage key
 * @return promise 
 */
module.getLocalStorageByKey = async ( key )  => {
	return new Promise(( resolve, reject ) => {
		try {
			chrome.storage.sync.get( key, ( result ) => {
				resolve( result[key] )
			})
		} catch ( err ) {
			reject( err )
		}
	})
}

/**
 * Set values to chrome local storage by key
 * @param {string} The local storage key
 * @param {object|string|number} The value of need to be stored
 * @return promise
 */
module.setLocalStorageData = async ( key, value )  => {
	return new Promise(( resolve, reject ) => {
		try {
			chrome.storage.sync.set({ [key]: value }, ( result ) => {
				resolve( true )
			})
		} catch ( err ) {
			reject( err )
		}
	})
}

/**
 * Show rich notifications to the user
 * @param {object} data Notification object
 * @return promise
 */
module.showNotification = async ( data )  => {
	return new Promise(( resolve, reject ) => {
		try {
			chrome.notifications.create( '', data, () => {
				// Let's keep this console log, so we know user has been notified 
				console.log( 'Notified!' )
				resolve( true )
			})
		} catch ( err ) {
			reject( err )
		}
	})
}

/**
 * Helper function to sleep 
 */
module.sleep = async ms => ( await new Promise(resolve => {setTimeout(resolve, ms)}) )

// Export the module
export default module
