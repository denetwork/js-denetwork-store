import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "denetwork-utils";
import { TQueryListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { SchemaUtil } from "../utils/SchemaUtil";
import { MStatisticEntity } from "../models/MStatisticEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";
import { EtherWallet } from "web3id";


/**
 * 	Comment
 */
export const commentSchema = new Schema( {
	...MBaseEntity,
	postHash : {
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		type : String,
		validate: {
			//	Starts with "0x" (case-insensitive)
			validator : ( v: string ) => SchemaUtil.isValidKeccak256Hash( v ),
			message: ( props: any ) : string => `invalid ${props.path}, must be 66 lowercase hex characters`
		},
		required: [ true, '{PATH} required' ]
	},
	authorName : {
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 128 characters)`
		},
		required: [ true, '{PATH} required' ]
	},
	authorAvatar : {
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 256 characters)`
		},
		required: [ true, '{PATH} required' ]
	},
	parentHash : {
		//	[optional] parent comment hash
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		type : String,
		validate: {
			//	Starts with "0x" (case-insensitive)
			validator : ( v: string ) => SchemaUtil.isValidKeccak256Hash( v ),
			message: ( props: any ) : string => `invalid ${props.path}, must be 66 lowercase hex characters`
		},
		required: false
	},
	statisticChildrenCount : {
		//	[optional] children count
		type : Number,
		validate: {
			validator : ( v: number ) => v >= 0,
			message: ( props: any ) : string => `invalid ${ props.path }`
		},
		required: false
	},
	replyTo : {
		//	Reply to the specified author name. @authorName
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 128 characters)`
		},
		required: false
	},
	replyToWallet : {
		//	reply to the specified wallet
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && EtherWallet.isValidAddress( v ),
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 128 characters)`
		},
		required: false
	},
	replyToAuthorName : {
		//	Reply to the specified author name. @authorName
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 128 characters)`
		},
		required: false
	},
	replyToAuthorAvatar : {
		//	Reply to the specified author name. @authorName
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 256 characters)`
		},
		required: false
	},
	postSnippet : {
		//	post-body snippet
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 2048,
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 2048 characters)`
		},
		required: [ true, '{PATH} required' ]
	},
	body : {
		//	comment body/content
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 2048,
			message: ( props: any ) : string => `invalid ${props.path}. (should be less than 2048 characters)`
		},
		required: [ true, '{PATH} required' ]
	},
	pictures : {
		type : [String],
		validate: {
			validator : ( v: any ) =>
			{
				if ( ! Array.isArray( v ) )
				{
					return false;
				}
				for ( const picture of v )
				{
					if ( ! TypeUtil.isNotEmptyString( v ) || v.length > 256 )
					{
						return false;
					}
				}
				return true;
			},
			message: ( props: any ) : string => `invalid ${props.path}. (each element should be less than 256 characters)`
		},
		required: false
	},
	videos : {
		type : [String],
		validate: {
			validator : ( v: any ) =>
			{
				if ( ! Array.isArray( v ) )
				{
					return false;
				}
				for ( const picture of v )
				{
					if ( ! TypeUtil.isNotEmptyString( v ) || v.length > 256 )
					{
						return false;
					}
				}
				return true;
			},
			message: ( props: any ) : string => `invalid ${props.path}. (each element should be less than 256 characters)`
		},
		required: false
	},
	bitcoinPrice : {
		//	Bitcoin price, just a string
		type : String,
		required : false
	},
	...MStatisticEntity,
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		byWalletAndPostHash( wallet: string, postHash ?: string )
		{
			if ( SchemaUtil.isValidKeccak256Hash( postHash ) )
			{
				return this.where({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet,
					postHash : postHash,
				} );
			}
			else
			{
				return this.where({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet
				} );
			}
		},
		byPostHash( postHash : string )
		{
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				postHash : postHash
			} );
		},
		byPostHashAndParentHash( postHash : string, parentHash : string )
		{
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				postHash : postHash,
				parentHash : parentHash,
			} );
		},
		byWalletAndId( wallet: string, id : Types.ObjectId )
		{
			//	find one
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				_id : id,
			} );
		},
		byWalletAndHexId( wallet: string, hexId : string )
		{
			//	find one
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				_id : Types.ObjectId.createFromHexString( hexId ),
			} );
		},
		byWalletAndHash( wallet: string, hash : string )
		{
			//	find one
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				hash : hash,
			} );
		},
		byHash( hash : string )
		{
			//	find one
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				hash : hash,
			} );
		}
	}
} );

export type CommentType = InferSchemaType< typeof commentSchema > & Document<Types.ObjectId>;
// InferSchemaType will determine the type as follows:
// type ContactsType = {
//	version : string;
//	wallet : string;
//	sig : string;
//	...
// }

export type CommentListResult = TQueryListResult &
{
	list : Array< CommentType >;
}


export const CommentModel = model( 'Comment', commentSchema );
