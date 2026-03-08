import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SeoStrategy extends TitleStrategy {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(title);
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ name: 'twitter:title', content: title });
    }

    // Attempt to extract description and ogImage from the route data
    // We walk through the state tree to find the deepest data
    let currentRoute = routerState.root;
    let description = 'Free online developer tools including regex tester, code formatter, JSON tools, and code comparison.';
    let ogImage = 'https://an-nguyenbinhit.github.io/DevWorkspace/assets/layout/images/logo.svg';

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
      if (currentRoute.data) {
        if (currentRoute.data['description']) {
          description = currentRoute.data['description'];
        }
        if (currentRoute.data['ogImage']) {
          ogImage = currentRoute.data['ogImage'];
        }
      }
    }

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    // Add canonical URL
    const url = 'https://an-nguyenbinhit.github.io/DevWorkspace' + routerState.url.split('?')[0];
    this.meta.updateTag({ property: 'og:url', content: url });
    // Note: Canonical link tag technically should be a <link rel="canonical" href="...">
    // For simplicity, we just manage the OG url. If true canonical is needed, we'd manipulate the DOM:
    this.updateCanonicalUrl(url);
  }

  private updateCanonicalUrl(url: string) {
    const head = this.document.getElementsByTagName('head')[0];
    let element: HTMLLinkElement | null = this.document.querySelector(`link[rel='canonical']`) || null;
    if (element === null) {
      element = this.document.createElement('link') as HTMLLinkElement;
      head.appendChild(element);
    }
    element.setAttribute('rel', 'canonical');
    element.setAttribute('href', url);
  }
}
