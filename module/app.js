// Module object to export
const module = {}

/**
 * Get local storage values by key
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

module.setLocalStorageData = async ( key, value )  => {
	return new Promise(( resolve, reject ) => {
		try {
			let obj = {};
			obj[key] = value;
			chrome.storage.sync.set({ [key]: value }, ( result ) => {
				resolve( true )
			})
		} catch ( err ) {
			reject( err )
		}
	})
}

// Export the module
export default module;
