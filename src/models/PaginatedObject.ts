export default class PaginatedObject<T> {
  public static PER_PAGE = 10;

  /**PROPERTIES**/
  currentPage: number;
  perPage: number;
  key: string;
  total: number;
  totalInPage: number;
  data: Array<T>;

  constructor(
    currentPage: number = 1,
    perPage: number = PaginatedObject.PER_PAGE,
    key: string = '',
    total: number = 0,
    data: Array<T> = [],
  ) {
    this.currentPage = currentPage;
    this.perPage = perPage;
    this.key = key;
    this.total = total;
    this.data = data;
    this.totalInPage = data.length;
  }
}
