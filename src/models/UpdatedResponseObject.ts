export default class UpdatedResponseObject<T> {
  result: boolean;
  messages: string[];
  data?: T;

  constructor(result: boolean = false, messages: string[] = [], data?: T) {
    this.result = result;
    this.messages = messages;
    this.data = data;
  }
}
