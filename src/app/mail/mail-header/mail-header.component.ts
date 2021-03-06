import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { NgbDropdownConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppState, UserState } from '../../store/datatypes';
import { Store } from '@ngrx/store';
import { ExpireSession, Logout } from '../../store/actions';
import { TranslateService } from '@ngx-translate/core';
import { Language, LANGUAGES } from '../../shared/config';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { FormControl } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { ComposeMailService } from '../../store/services/compose-mail.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SearchState } from '../../store/reducers/search.reducers';
import { LOADING_IMAGE } from '../../store/services';

@Component({
  selector: 'app-mail-header',
  templateUrl: './mail-header.component.html',
  styleUrls: ['./mail-header.component.scss']
})
export class MailHeaderComponent implements OnInit, OnDestroy {
  @ViewChild('logoutModal', { static: false }) logoutModal;

  // Public property of boolean type set false by default
  menuIsOpened: boolean = false;
  selectedLanguage: Language = { name: 'English', locale: 'en' };
  languages = LANGUAGES;
  searchInput = new FormControl();
  searchPlaceholder: string = 'common.search';
  loadingImage = LOADING_IMAGE;
  private isContactsPage: boolean;

  constructor(private store: Store<AppState>,
              config: NgbDropdownConfig,
              private router: Router,
              private translate: TranslateService,
              private modalService: NgbModal,
              @Inject(DOCUMENT) private document: Document,
              private composeMailService: ComposeMailService) {
    config.autoClose = true;
  }

  ngOnInit() {
    this.store.select(state => state.user).pipe(untilDestroyed(this))
      .subscribe((user: UserState) => {
        if (user.settings.language) {
          const language = this.languages.filter(item => item.name === user.settings.language)[0];
          if (this.selectedLanguage.name !== language.name) {
            this.translate.use(language.locale);
            this.selectedLanguage = language;
          }
          this.selectedLanguage = language;
        }
      });

    this.setSearchPlaceholder(this.router.url);
    this.router.events.pipe(untilDestroyed(this), filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.setSearchPlaceholder(event.url);
      });

    this.store.select(state => state.search).pipe(untilDestroyed(this))
      .subscribe((searchState: SearchState) => {
        this.searchInput.setValue('', { emitEvent: false, emitModelToViewChange: true, emitViewToModelChange: false });
      });
  }

  setSearchPlaceholder(url) {
    this.isContactsPage = url === '/mail/contacts';
    this.searchPlaceholder = this.isContactsPage ? 'common.search_contacts' : 'common.search';
  }

  search() {
    if (this.searchInput.value) {
      if (this.isContactsPage) {
        this.router.navigate(['/mail/contacts'], { queryParams: { search: this.searchInput.value } });
      } else {
        this.router.navigate(['/mail/search/page', 1], { queryParams: { search: this.searchInput.value } });
      }
    }
  }

  // == Setup click event to toggle mobile menu
  toggleMenu() { // click handler
    const bool = this.menuIsOpened;
    this.menuIsOpened = bool === false ? true : false;
    this.document.body.classList.add('menu-open');
  }

  logout() {
    const modalRef = this.modalService.open(this.logoutModal, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-md change-password-modal'
    });
    setTimeout(() => {
      this.store.dispatch(new ExpireSession());
      setTimeout(() => {
        this.store.dispatch(new Logout());
        modalRef.close();
      }, 500);
    }, 2500);
  }

  openComposeMailDialog(receivers) {
    this.composeMailService.openComposeMailDialog({ receivers });
  }

  ngOnDestroy(): void {
  }
}
