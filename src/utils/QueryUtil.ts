import { SortOrder } from "mongoose";
import { TypeUtil } from "denetwork-utils";

/**
 * 	@class QueryUtil
 */
export class QueryUtil
{
	/**
	 *	@param sortBy	{ { [ key : string ] : SortOrder } }
	 *	@returns { { [ key : string ] : SortOrder } }
	 */
	public static getSafeSortBy( sortBy ?: { [ key : string ] : SortOrder } ) : { [ key : string ] : SortOrder }
	{
		return ( sortBy && TypeUtil.isNotNullObject( sortBy ) ) ?
			sortBy :
			{ createdAt: -1 }	// -1 means descending order
		;
	}
}
