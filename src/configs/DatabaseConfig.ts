import { ConnectOptions } from "mongoose";

/**
 * 	@config
 */
let databaseUrl : string = `mongodb://127.0.0.1:27017/denetwork`;
let databaseConnectOptions : ConnectOptions = {};


/**
 * 	@class DatabaseConfig
 */
export class DatabaseConfig
{
	/**
	 * 	@returns {string}
	 */
	public static getUrl() : string
	{
		return databaseUrl;
	}

	/**
	 *	@param url
	 *	@returns {void}
	 */
	public static setUrl( url : string ) : void
	{
		databaseUrl = url;
	}

	/**
	 * 	@returns {ConnectOptions}
	 */
	public static getConnectOptions() : ConnectOptions
	{
		return databaseConnectOptions;
	}

	/**
	 *	@param options	{ConnectOptions}
	 *	@returns {void}
	 */
	public static setConnectOptions( options : ConnectOptions ) : void
	{
		databaseConnectOptions = options;
	}
}
