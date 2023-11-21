import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "denetwork-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { MStatisticEntity } from "../models/MStatisticEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";
import { MRefEntity } from "../models/MRefEntity";


/**
 *	define post content types
 */
export enum PostContentTypes
{
	original = 'original',
	reposted = 'reposted',
	quoted = 'quoted',
}

/**
 * 	Post
 */
export const postSchema = new Schema( {
	...MBaseEntity,
	contentType : {
		//	post content type
		type : String,
		validate : {
			validator : ( v : PostContentTypes ) => Object.values( PostContentTypes ).includes( v ),
			message : ( props : any ) : string => `invalid ${ props.path }`
		},
		enum : Object.values( PostContentTypes ),
		required : [ true, '{PATH} required' ],
		default : PostContentTypes.original,
	},
	authorName : {
		type : String,
		validate : {
			validator : ( v : any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message : ( props : any ) : string => `invalid ${ props.path }, should be less than 128 characters`
		},
		required : [ true, '{PATH} required' ]
	},
	authorAvatar : {
		type : String,
		validate : {
			validator : ( v : any ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message : ( props : any ) : string => `invalid ${ props.path }, should be less than 256 characters`
		},
		required : [ true, '{PATH} required' ]
	},
	body : {
		//	post body/content
		type : String,
		validate : {
			validator : ( v : any ) => TypeUtil.isNotEmptyString( v ) && v.length < 2048,
			message : ( props : any ) : string => `invalid ${ props.path }, should be less than 2048 characters`
		},
		required : [ true, '{PATH} required' ]
	},
	pictures : {
		type : [ String ],
		validate : {
			validator : ( v : any ) =>
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
			message : ( props : any ) : string => `invalid ${ props.path }, each element should be less than 256 characters`
		},
		required : false
	},
	videos : {
		type : [ String ],
		validate : {
			validator : ( v : any ) =>
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
			message : ( props : any ) : string => `invalid ${ props.path }, each element should be less than 256 characters`
		},
		required : false
	},
	bitcoinPrice : {
		//	Bitcoin price, just a string
		type : String,
		required : false
	},

	//	refAuthorWallet, refAuthorName, refAuthorAvatar, refType, refHash
	...MRefEntity,

	//	statisticView, statisticRepost, ...
	...MStatisticEntity,

	//	remark
	...MRemarkEntity

}, {
	timestamps : true,
	query : {
		byWalletAndId( wallet : string, id : Types.ObjectId )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				_id : id,
			} );
		},
		byWalletAndHexId( wallet : string, hexId : string )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				_id : Types.ObjectId.createFromHexString( hexId ),
			} );
		},
		byWalletAndHash( wallet : string, hash : string )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				hash : hash,
			} );
		},
		byWallet( wallet : string )
		{
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet
			} );
		},
		byHash( hash : string )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				hash : hash,
			} );
		},
		byRefAuthorWallet( refAuthorWallet : string )
		{
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				refAuthorWallet : refAuthorWallet,
			} );
		}
	}
} );

export type PostType = InferSchemaType<typeof postSchema> & Document<Types.ObjectId>;
// InferSchemaType will determine the type as follows:
// type ContactsType = {
//	version : string;
//	wallet : string;
//	sig : string;
//	...
// }

export type PostListResult = TQueueListResult &
	{
		list : Array<PostType>;
	}


export const PostModel = model( 'Post', postSchema );

