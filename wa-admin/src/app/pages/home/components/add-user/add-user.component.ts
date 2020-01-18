import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
import { AlertService } from 'src/app/services/alert.service';
import { StateService } from 'src/app/services/state.service';
import { AppConfigService } from 'src/app/services/app-config.service';

const url = AppConfigService.settings.publicSite.url;

@Component({
  selector: 'waa-add-user',
  template: `
    <waa-item-header title="Invite"> </waa-item-header>
    <waa-view-wrapper>
      <div class="view-wrapper">
        <mat-card [formGroup]="fg" *ngIf="index === 0; else preview">
          <waa-card-toolbar title="Invite User"> </waa-card-toolbar>
          <ion-item>
            <ion-label position="stacked"
              >Email Address <ion-text color="danger">*</ion-text></ion-label
            >
            <ion-input
              formControlName="email"
              placeholder="email@example.com"
              (keyup.enter)="submit(fg)"
            >
            </ion-input>
            <ion-note
              *ngIf="
                (invalid && fg['controls'].email.invalid) ||
                (fg['controls'].email.touched && fg['controls'].email.invalid)
              "
            >
              <ion-text color="danger"
                >Invalid email address
              </ion-text></ion-note
            >
          </ion-item>

          <!-- <ion-item>
            <ion-label position="stacked">First Name</ion-label>
            <ion-input
              formControlName="firstName"
              placeholder="John"
              (keyup.enter)="submit(fg)"
            >
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Last Name</ion-label>
            <ion-input
              formControlName="lastName"
              placeholder="Doe"
              (keyup.enter)="submit(fg)"
            >
            </ion-input>
          </ion-item> -->
        </mat-card>
        <ion-footer>
          <ion-toolbar color="secondary">
            <ion-buttons slot="secondary" *ngIf="this.index">
              <ion-button (click)="this.index = 0">
                <mat-icon>arrow_back_ios</mat-icon>

                <ion-label>Back</ion-label>
              </ion-button>
            </ion-buttons>
            <ion-buttons slot="primary">
              <ion-button (click)="submit(fg)">
                <ion-label slot="start">{{ nextLabel }}</ion-label>
                <mat-icon>arrow_forward_ios</mat-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-footer>
      </div>
    </waa-view-wrapper>

    <ng-template #preview>
      <waa-add-user-preview
        [email]="fg.value['email']"
        [firstName]="fg.value['firstName']"
        [lastName]="fg.value['lastName']"
        link="{{ url }}new-link"
        state="unsubmitted"
        [fields]="fields"
      >
      </waa-add-user-preview>
    </ng-template>
  `,
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  title = 'Add user';
  fg: FormGroup;
  index = 0;
  invalid: boolean;
  url: string;

  get nextLabel() {
    return !this.index ? 'Next' : 'Submit';
  }

  get fields() {
    const created = new Date();
    const expiry = new Date(created);
    expiry.setDate(created.getDate() + 1);
    return [
      {
        key: 'expiry',
        value: expiry
      },
      {
        key: 'created',
        value: created
      },
      {
        key: 'addedBy',
        value: this.stateSvc.user.email
      }
    ];
  }

  constructor(
    private actionSvc: ActionService,
    private stateSvc: StateService,
    private alertSvc: AlertService,
    private router: Router
  ) {
    this.setFg();
    this.url = url;
  }

  ngOnInit() {}

  setFg() {
    this.fg = new FormGroup({
      firstName: new FormControl(''),
      lastName: new FormControl(''),

      email: new FormControl('', [
        Validators.required,
        Validators.email
      ])
    });
  }

  async submit(fg) {
    if (fg.invalid) {
      fg.markAsTouched();
      fg.updateValueAndValidity();
      this.invalid = true;
      return (this.fg = fg);
    }

    const { email, firstName, lastName } = this.fg.value;
    if (this.index === 0) {
      this.index = 1;
    } else {
      const addedBy = this.stateSvc.user.username;
      try {
        const response = await this.actionSvc
          .createInvitation({
            email,
            firstName,
            lastName,
            addedBy
          })
          .toPromise();
        const created = new Date();
        const expiry = new Date();
        expiry.setDate(created.getDate() + 1);

        const res = await this.alertSvc.confirmBox({
          header: 'Invitation Sent!',
          message: 'Would you like to create another user?',
          decline: 'Home',
          confirm: 'Add another'
        });
        if (res) return this.resetState();
        return this.router.navigate(['/']);
      } catch (err) {
        console.log(err);
        this.alertSvc.error({
          header: 'An error occurred adding the user',
          message: err.error.error.message
        });
      }
    }
  }

  resetState() {
    this.setFg();
    this.index = 0;
  }
}
