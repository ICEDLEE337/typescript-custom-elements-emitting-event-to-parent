// Import stylesheets
import { Observable, share, shareReplay, Subject, Subscription, tap } from 'rxjs';
import './style.css';


abstract class OniElement<TAttributes> extends HTMLElement {
  subjects$$: Record<string, Subject<any>> = {};
  $: Record<string, Observable<any>> = {};
  attrSubscriptions: Record<string, Subscription> = {};
  subscriptions: Array<Subscription> = [];

  onChanges(attr: keyof TAttributes) {
    return (this.$ as any)[attr];
  }

  emit(handlerName: string, $event: any) {
    const handler = this.getAttribute('clicked');
    if (handler) {
      Function(`const $event = arguments[0]; ${handler}`)($event)
    }
  }

  constructor(public attrs: string[], lifeCyclers?: {

  }) {
    super();
    (attrs || []).forEach(attr => {
      const subject = new Subject();
      this.subjects$$[attr] = subject;
      const observable$ = subject.asObservable().pipe(shareReplay());
      this.$[attr] = observable$;
      this.attrSubscriptions[attr] = observable$.subscribe();
    });
  }

  abstract oniConnectedCallback(): void;

  connectedCallback() {
    (this.oniSubscribe() || []).forEach($ => this.subscriptions.push($.subscribe()));
    this.oniConnectedCallback();
  }

  abstract oniDisconnectedCallback(): void;

  disconnectedCallback() {
    (this.subscriptions).forEach(sub => {
      sub.unsubscribe();
    });

    (this.attrs || []).forEach(attr => {
      this.attrSubscriptions[attr].unsubscribe();
    });
    this.oniDisconnectedCallback();
  }

  abstract oniAdoptedCallback(): void;
  abstract oniSubscribe(): Observable<any>[];

  adoptedCallback() {
    this.oniAdoptedCallback();
  }  

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (oldValue != newValue) {
      const subject$$ = this.subjects$$[name];
      if (subject$$)
        subject$$.next(newValue);
    }
  }
}


class OniButton extends OniElement<{ color: string, size: string }> {
  static observedAttributes = ["color", "size"];
  i = 0;

  constructor() {
    super(OniButton.observedAttributes);
  }

  override oniConnectedCallback() {
  }

  override oniSubscribe() {
    return [
      this.onChanges('color').pipe(
        tap(
          (color: string) => this.style.backgroundColor = color
        )
      )
    ];
  }

  onClick(el) {
    const colors = [
      'red',
      'orange',
      'yellow',
      'green',
      'blue',
      'violet'
    ];
    const i = this.i++ % colors.length;
    el.setAttribute('color', colors[i]);
    el.style.backgroundColor = colors[i]    

    this.emit('clicked', colors[i]);
  }

  override oniDisconnectedCallback() { }

  override oniAdoptedCallback() { }
}

customElements.define("oni-button", OniButton);


const appDiv: HTMLElement = document.getElementById('app');

appDiv.innerHTML = `
  <oni-button
    clicked="console.warn(\`parent responding to \${$event}\`)"
    onclick="this.onClick(app)"
    color="lightsteelblue"
  >
    click me
  </oni-button>
`;
