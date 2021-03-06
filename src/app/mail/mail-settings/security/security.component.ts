import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppState, Auth2FA, AuthState, ContactsState, PlanType, Settings, UserState } from '../../../store/datatypes';
import { Store } from '@ngrx/store';
import { MailSettingsService } from '../../../store/services/mail-settings.service';
import {
  ChangePassphraseSuccess,
  ChangePassword,
  Update2FA,
  Get2FASecret,
  ContactsGet,
  ClearContactsToDecrypt
} from '../../../store/actions';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpenPgpService, SharedService } from '../../../store/services';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PasswordValidation } from '../../../users/users-create-account/users-create-account.component';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { apiUrl } from '../../../shared/config';

@Component({
  selector: 'app-settings-security',
  templateUrl: './security.component.html',
  styleUrls: ['./../mail-settings.component.scss', './security.component.scss']
})
export class SecurityComponent implements OnInit, OnDestroy {
  @ViewChild('changePasswordModal', { static: false }) changePasswordModal;
  @ViewChild('auth2FAModal', { static: false }) auth2FAModal;
  @ViewChild('decryptContactsModal', { static: false }) decryptContactsModal;
  @ViewChild('confirmEncryptContactsModal', { static: false }) confirmEncryptContactsModal;

  private changePasswordModalRef: NgbModalRef;
  private decryptContactsModalRef: NgbModalRef;

  settings: Settings;
  changePasswordForm: FormGroup;
  showChangePasswordFormErrors = false;
  userState: UserState;
  inProgress: boolean;
  deleteData: boolean;
  apiUrl = apiUrl;
  auth2FA: Auth2FA;
  auth2FAForm: any = {};
  isDecryptingContacts: boolean;
  contactsState: ContactsState;
  isContactsEncrypted: boolean;
  planTypeEnum = PlanType;
  planType: PlanType;

  private updatedPrivateKeys: Array<any>;
  private canDispatchChangePassphrase: boolean;

  constructor(private store: Store<AppState>,
              private settingsService: MailSettingsService,
              private modalService: NgbModal,
              private openPgpService: OpenPgpService,
              private sharedService: SharedService,
              private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.store.select(state => state.user).pipe(untilDestroyed(this))
      .subscribe((user: UserState) => {
        this.userState = user;
        this.settings = user.settings;
        this.planType = user.settings.plan_type || PlanType.FREE;
        this.isContactsEncrypted = this.settings.is_contacts_encrypted;
      });
    this.store.select(state => state.auth).pipe(untilDestroyed(this))
      .subscribe((authState: AuthState) => {
        this.auth2FA = authState.auth2FA;
        if (authState.updatedPrivateKeys && this.canDispatchChangePassphrase) {
          this.canDispatchChangePassphrase = false;
          this.updatedPrivateKeys = [...authState.updatedPrivateKeys];
          this.changePasswordConfirmed();
          this.store.dispatch(new ChangePassphraseSuccess(null));
        }
        if (this.inProgress && !authState.inProgress) {
          this.changePasswordModalRef.dismiss();
          if (authState.isChangePasswordError) {
            this.openPgpService.revertChangedPassphrase(this.changePasswordForm.value.oldPassword, this.deleteData);
          } else {
            const privKeys: any = {};
            const pubKeys: any = {};
            this.updatedPrivateKeys.forEach(item => {
              privKeys[item.mailbox_id] = item.private_key;
              pubKeys[item.mailbox_id] = item.public_key;
            });
            this.openPgpService.clearData(pubKeys);
            this.openPgpService.decryptPrivateKeys(privKeys, this.changePasswordForm.value.password);
          }
          this.inProgress = false;
        }
      });

    this.store.select(state => state.contacts).pipe(untilDestroyed(this))
      .subscribe((contactsState: ContactsState) => {
        this.contactsState = contactsState;
      });

    this.changePasswordForm = this.formBuilder.group({
        oldPassword: ['', [Validators.required]],
        password: ['', [Validators.required]],
        confirmPwd: ['', [Validators.required]]
      },
      {
        validator: PasswordValidation.MatchPassword
      });
  }

  updateSettings(key?: string, value?: any) {
    this.settingsService.updateSettings(this.settings, key, value);
  }

  updateAntiPhishing(status: boolean) {
    if (this.settings.is_anti_phishing_enabled !== status) {
      this.settings.anti_phishing_phrase = Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
      this.settingsService.updateSettings(this.settings, 'is_anti_phishing_enabled', status);
    }
  }

  get2FASecret() {
    this.store.dispatch(new Get2FASecret());
    this.modalService.open(this.auth2FAModal, {
      centered: true,
      windowClass: 'modal-md auth2fa-modal'
    });
  }

  update2FA(enable_2fa: boolean = true) {
    if (!this.auth2FAForm.passcode || !this.auth2FAForm.password) {
      this.auth2FAForm.submitted = true;
      return;
    }
    this.store.dispatch(new Update2FA({
      data: { ...this.auth2FAForm, enable_2fa, username: this.userState.username },
      settings: { ...this.settings, enable_2fa }
    }));
  }

  disable2FA() {
    this.auth2FAForm = { auth2FAStep: 2, enable_2fa: false };
    this.modalService.open(this.auth2FAModal, {
      centered: true,
      windowClass: 'modal-md auth2fa-modal'
    });
  }

  copyToClipboard(value: string) {
    this.sharedService.copyToClipboard(value);
  }


  // == Open change password NgbModal
  openChangePasswordModal() {
    this.deleteData = false;
    this.inProgress = false;
    this.showChangePasswordFormErrors = false;
    this.changePasswordForm.reset();
    this.changePasswordModalRef = this.modalService.open(this.changePasswordModal, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-md change-password-modal'
    });
  }

  // == Open encrypt contacts confirmation NgbModal
  openDecryptContactsModal() {
    if (!this.settings.is_contacts_encrypted) {
      return;
    }
    this.isContactsEncrypted = false;
    this.decryptContactsModalRef = this.modalService.open(this.decryptContactsModal, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-md change-password-modal'
    });
    this.decryptContactsModalRef.result.then((reason) => {
      this.isDecryptingContacts = false;
      this.decryptContactsModalRef = null;
    });
    setTimeout(() => {
      this.isContactsEncrypted = true;
    }, 100);
  }

  openConfirmEncryptContactsModal() {
    if (this.settings.is_contacts_encrypted) {
      return;
    }
    this.isContactsEncrypted = true;
    setTimeout(() => {
      this.isContactsEncrypted = false;
    }, 100);
    this.modalService.open(this.confirmEncryptContactsModal, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-md change-password-modal'
    });
  }

  confirmDecryptContacts() {
    this.updateSettings('is_contacts_encrypted', false);
    if (this.contactsState.totalContacts === 0 && this.contactsState.loaded) {
      this.decryptContactsModalRef.close();
      return;
    }
    this.isDecryptingContacts = true;
    this.store.dispatch(new ClearContactsToDecrypt({ clearCount: true }));
    this.store.dispatch(new ContactsGet({ limit: 20, offset: 0, isDecrypting: true }));
    this.decryptAllContacts();
  }

  decryptAllContacts() {
    if (this.contactsState.totalContacts === 0 && this.contactsState.loaded) {
      this.decryptContactsModalRef.close();
      return;
    }
    if (this.contactsState.contactsToDecrypt.length > 0) {
      this.openPgpService.decryptAllContacts();
      return;
    }
    setTimeout(() => {
      this.decryptAllContacts();
    }, 500);
  }

  closeDecryptContactsModal() {
    this.isDecryptingContacts = false;
    if (this.decryptContactsModalRef) {
      this.decryptContactsModalRef.close();
    }
  }

  changePassword() {
    this.showChangePasswordFormErrors = true;
    if (this.changePasswordForm.valid) {
      this.inProgress = true;
      this.canDispatchChangePassphrase = true;
      this.openPgpService.changePassphrase(this.changePasswordForm.value.password, this.deleteData, this.userState.username);
    }
  }

  changePasswordConfirmed() {
    const data = this.changePasswordForm.value;
    const requestData = {
      username: this.userState.username,
      old_password: data.oldPassword,
      password: data.password,
      confirm_password: data.confirmPwd,
      new_keys: this.updatedPrivateKeys,
      delete_data: this.deleteData,
    };
    this.store.dispatch(new ChangePassword(requestData));
    this.inProgress = true;
  }

  // == Toggle password visibility
  togglePassword(input: any): any {
    if (!input.value) {
      return;
    }
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  ngOnDestroy(): void {
  }
}
