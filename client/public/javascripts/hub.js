Hub = new JS.Class({
  initialize: function(comet) {
    this._comet = comet;
    this._channels = new JS.SortedSet([]);
    
    this._channelList = Ojay('#channels div');
    
    this._comet.subscribe('/all/newchannel', this.method('_newChannel'));
    this.setupLoginForm();
  },
  
  setupLoginForm: function() {
    this._loginForm = Ojay('#login form');
    this._loginForm.on('submit', function(form, evnt) {
      evnt.stopDefault();
      this.loadLibrary(Ojay.Forms.getData(form));
    }, this);
  },
  
  loadLibrary: function(params) {
    this._libraryName    = params.libraryName;
    this._libraryAddress = params.libraryAddress;
    Ojay.HTTP.GET(this._libraryAddress, {jsonp: 'callback'}, function(data) {
      
      this._artists = data.artists.reduce(function(set, artist) {
        set.add(artist);
        return set;
      }, new JS.SortedSet([]) );
      
      this._albums = data.albums.reduce(function(set, album) {
        set.add(album);
        return set;
      }, new JS.SortedSet([]) );
      
      this._comet.publish('/all/newchannel', {name: this._libraryName});
    }.bind(this));
  },
  
  _newChannel: function(channel) {
    if (channel.name === this._libraryName) return;
    this._channels.add(channel.name);
    this.refreshChannelList();
  },
  
  refreshChannelList: function() {
    var channels = this._channels;
    this._channelList.setContent( Ojay.HTML.ul(function(h) {
      channels.forEach(h.method('li'));
    }) );
  }
});
