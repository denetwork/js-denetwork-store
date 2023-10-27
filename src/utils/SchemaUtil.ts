import { Schema, Types } from "mongoose";
import { TypeUtil } from "denetwork-utils";
import { commentSchema } from "../entities/CommentEntity";
import { contactSchema } from "../entities/ContactEntity";
import { favoriteSchema } from "../entities/FavoriteEntity";
import { followerSchema } from "../entities/FollowerEntity";
import { likeSchema } from "../entities/LikeEntity";
import { postSchema } from "../entities/PostEntity";
import { profileSchema } from "../entities/ProfileEntity";

/**
 * 	@class SchemaUtil
 */
export class SchemaUtil
{

	/**
	 *	@param time	{number}
	 *	@returns {Types.ObjectId}
	 */
	public static createObjectIdFromTime( time: number ) : Types.ObjectId
	{
		return Types.ObjectId.createFromTime( time );
	}

	/**
	 *	@param time	{number}
	 *	@returns {string}
	 */
	public static createHexStringObjectIdFromTime( time: number ) : string
	{
		return Types.ObjectId.createFromTime( time ).toHexString();
	}

	/**
	 *	@param v	{any}
	 *	@returns {boolean}
	 */
	public static isValidKeccak256Hash( v : any ) : boolean
	{
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		//	Starts with "0x" (case-insensitive)
		return TypeUtil.isNotEmptyString( v ) && 66 === v.length && /^0x[0-9a-f]{64}$/.test( v );
	}

	/**
	 *	@param schemaName	{string}
	 *	@returns { Schema | null }
	 */
	public static getSchemaByName( schemaName : string ) : Schema | null
	{
		switch ( schemaName )
		{
			case 'comment' :
				return commentSchema;
			case 'contact':
				return contactSchema;
			case 'favorite':
				return favoriteSchema;
			case 'follower':
				return followerSchema;
			case 'like':
				return likeSchema;
			case 'post':
				return postSchema;
			case 'profile':
				return profileSchema;
		}

		return null;
	}

	/**
	 *	@param schema	{Schema}
	 *	@returns {Array<string> | null}
	 */
	public static getRequiredKeys( schema : Schema | string ) : Array<string> | null
	{
		try
		{
			let instance : Schema | null;
			if ( schema instanceof Schema )
			{
				//	Schema
				instance = schema;
			}
			else
			{
				//	string
				instance = this.getSchemaByName( schema );
			}
			if ( ! instance )
			{
				return null;
			}

			return Object.keys( instance.paths ).filter( path => instance && instance.paths[ path ].isRequired );
		}
		catch ( err )
		{
		}

		return null;
	}

	/**
	 *	@param schema	{ Schema | string }
	 *	@param prefix	{string}
	 *	@returns {Array<string> | null}
	 */
	public static getPrefixedKeys( schema : Schema | string, prefix : string ) : Array<string> | null
	{
		try
		{
			let instance : Schema | null;
			if ( schema instanceof Schema )
			{
				//	Schema
				instance = schema;
			}
			else
			{
				//	string
				instance = this.getSchemaByName( schema );
			}
			if ( ! instance )
			{
				return null;
			}
			if ( ! TypeUtil.isNotEmptyString( prefix ) )
			{
				return null;
			}

			return Object.keys( instance.paths ).filter( path => path.startsWith( prefix ) );
		}
		catch ( err )
		{
		}

		return null;
	}
}
