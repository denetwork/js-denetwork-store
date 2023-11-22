import { SortOrder } from "mongoose";

export type TQueryListOptions =
	{
		pageNo? : number,
		pageSize? : number,
		pageKey? : number,
		sort? : { [ key : string ] : SortOrder },
	};

export type TQueryListResult = TQueryListOptions &
	{
		total : number,
	};
