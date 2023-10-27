import { connection, connect, disconnect, ConnectOptions, Mongoose } from "mongoose";
import { DatabaseConfig } from "../configs/DatabaseConfig";
import { LogUtil } from "denetwork-utils";

/**
 * 	@class DatabaseConnection
 */
export class DatabaseConnection
{
	public conn !: Mongoose;

	constructor()
	{
	}

	/**
	 * 	@returns {Mongoose}
	 */
	public getConn() : Mongoose
	{
		return this.conn;
	}

	/**
	 * 	@returns {Promise<Mongoose>}
	 */
	public connect() : Promise<Mongoose>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const url : string = DatabaseConfig.getUrl();
				//
				//	Connection ready state:
				//	0 = disconnected
				//	1 = connected
				//	2 = connecting
				//	3 = disconnecting
				//
				if ( 0 === connection.readyState || ! this.conn )
				{
					/**
					 * 	connect options
					 */
					const options : ConnectOptions = {
						serverSelectionTimeoutMS : 30 * 10e3
					};
					this.conn = await connect( url, options );
					LogUtil.info( `Connected to the database [${ url }]` );
				}
				else if ( 1 === connection.readyState )
				{
					LogUtil.info( `Already connected to the database [${ url }]` );
				}
				else
				{
					LogUtil.info( `Connecting or disconnecting, waiting for the connection to complete` );
					connection.once( 'open', () =>
					{
						LogUtil.info( `Connected to the database [${ url }]` );
					} );
				}

				//	...
				resolve( this.conn );
			}
			catch ( err )
			{
				LogUtil.error( 'Error connecting to the database:', err );
				reject( err );
			}
		} );
	}

	/**
	 * 	@returns {Promise<boolean>}
	 */
	public disconnect() : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				await disconnect();
				LogUtil.info( `database connection has been disconnected` );

				//
				//	Connection ready state:
				//	0 = disconnected
				//	1 = connected
				//	2 = connecting
				//	3 = disconnecting
				//
				resolve( 0 === connection.readyState );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}
