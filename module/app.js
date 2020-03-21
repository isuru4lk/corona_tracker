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

// Export the module
export default module;