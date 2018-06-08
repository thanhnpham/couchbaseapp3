import { Injectable, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Platform, AlertController } from 'ionic-angular';
import { Couchbase, Database } from "cordova-couchbase/core";
import 'rxjs/add/operator/map';

@Injectable()
export class CouchbaseProvider {

  private isInstantiated: boolean;
  private database: Database;
  private listener: EventEmitter<any> = new EventEmitter();

  public constructor(platform: Platform, public alertCtrl: AlertController) {
      if(!this.isInstantiated) {
          platform.ready().then(() => {
              (new Couchbase()).openDatabase("mydb").then(database => {
                  this.database = database;
                  let views = {
                    items: {
                        map: function(doc) {
                            if(doc.type == "list" && doc.title) {
                                this.listener.emit(doc._id, {title: doc.title, rev: doc._rev})
                            }
                        }.toString()
                    }
                };
                this.database.createDesignDocument("_design/todo", views);
                this.database.listen(change => {
                    this.listener.emit(change.detail);
                })
                this.database.sync("http://vm0.syncgateway-aloz5oofiolao.centralus.cloudapp.azure.com:4985/nraboy", true);
                this.isInstantiated = true;
              }, error => {
                  this.errorHandle(error);
                  console.error(error);
              });
          });
      }
  }

  public errorHandle (error) {
    let prompt = this.alertCtrl.create( {
      title: 'Error',
      message: error,   
      buttons: [
        { text: 'Cancel', handler: data => {} }        
      ]
    });
    prompt.present();
  }
  public getDatabase() {
    return this.database;
  }

  public getChangeListener(): EventEmitter<any> {
    return this.listener;
}


}