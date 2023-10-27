import { ConnectOptions } from "mongoose";
import { DatabaseConfig } from "./configs/DatabaseConfig";

/**
 * 	database config
 */
export function getDatabaseUrl() : string
{
	return DatabaseConfig.getUrl();
}
export function setDatabaseUrl( url : string ) : void
{
	return DatabaseConfig.setUrl( url );
}


export function getDatabaseOptions() : ConnectOptions
{
	return DatabaseConfig.getConnectOptions();
}
export function setDatabaseOptions( options : ConnectOptions ) : void
{
	return DatabaseConfig.setConnectOptions( options );
}
