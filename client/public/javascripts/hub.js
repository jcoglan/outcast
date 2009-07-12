Hub = new JS.Class({
  initialize: function(comet) {
    this._comet = comet;
    this._channels = new JS.SortedSet([]);
    
    this._channelList = Ojay('#channels ul');
    this._artistList  = Ojay('#libraryView .artists ul');
    this._albumList   = Ojay('#libraryView .albums ul');
    this._trackList   = Ojay('#libraryView .tracks');
    
    this._player      = Ojay('#player .qt');
    this._playerInfo  = Ojay('#player .info');
    
    this._comet.subscribe('/all/newchannel', this.method('_newChannel'));
    this.setupLoginForm();
    
    this._currentStation = null;
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
    this._channelName    = params.libraryName.replace(/[^a-z]/ig, '');
    this._libraryAddress = params.libraryAddress.replace(/\/?$/, '');
    Ojay.HTTP.GET(this._libraryAddress, {jsonp: 'callback'}, function(data) {
      
      this._artists = new JS.SortedSet([]);
      this._albums  = new JS.SortedSet([]);
      this._tracks  = new JS.SortedSet([]);
      
      data.forEach(function(track) {
        this._artists.add(track.artist);
        this._albums.add(new Hub.Album(this, track.artist, track.album));
        this._tracks.add(new Hub.Track(this, track));
      }, this);
      
      this._comet.publish('/all/newchannel', {displayName: this._libraryName,
                                              channelName: this._channelName});
      Ojay('#login').hide();
      
      this.refreshLibraryView();
    }.bind(this));
  },
  
  _newChannel: function(channel) {
    if (channel.channelName === this._channelName) return;
    this._channels.add(new Hub.Channel(this, channel));
    this.refreshChannelList();
  },
  
  refreshChannelList: function() {
    this._channelList.setContent('');
    this._channels.forEach(function(channel) {
      this._channelList.insert(channel.getHTML());
    }, this);
  },
  
  refreshLibraryView: function() {
    this._artistList.setContent('');
    
    var all = Ojay( Ojay.HTML.a({href: '#'}, 'All artists') );
    all.on('click', Ojay.stopDefault)._(this).filterByArtist();
    this._artistList.insert(Ojay.HTML.li(all.node));
    
    this._artists.forEach(function(artist) {
      var link = Ojay( Ojay.HTML.a({href: '#'}, artist) );
      this._artistList.insert(Ojay.HTML.li(link.node));
      link.on('click', Ojay.stopDefault)._(this).filterByArtist(artist);
    }, this);
    
    this._albumList.setContent('');
    
    var all = Ojay( Ojay.HTML.a({href: '#'}, 'All albums') );
    all.on('click', Ojay.stopDefault)._(this).filterByAlbum();
    this._albumList.insert(Ojay.HTML.li(all.node));
    
    this._albums.forEach(function(album) {
      this._albumList.insert(album.getHTML());
    }, this);
    
    var tracks = this._tracks;
    this._trackList.setContent( Ojay.HTML.table(function(h) {
      h.thead(
        h.tr(
          h.td({className: 'artist'}, 'Artist'),
          h.td({className: 'album'}, 'Album'),
          h.td({className: 'track'}, 'Track No.'),
          h.td({className: 'name'}, 'Name')
        )
      );
      var body = Ojay(h.tbody());
      tracks.forEach(function(track) { body.insert(track.getHTML()) });
    }) );
  },
  
  filterByArtist: function(artist) {
    this._albums.forEach(function(album) {
      album[ !artist || album.artist === artist ? 'show' : 'hide' ]();
    });
    this._tracks.forEach(function(track) {
      track[ !artist || track.artist === artist ? 'show' : 'hide' ]();
    });
  },
  
  filterByAlbum: function(album) {
    this._tracks.forEach(function(track) {
      track[ !album || track.album === album ? 'show' : 'hide' ]();
    });
  },
  
  play: function(track) {
    var objectCode = QT_GenerateOBJECTText(track.path,
                                           '320', '16', '',
                                           'AUTOPLAY', 'True',
                                           'SCALE', 'Aspect');
    this._player.setContent(objectCode);
    this._playerInfo.setContent(track.artist + ' - ' + track.name);
  },
  
  broadcast: function(track) {
    this.play(track);
    this._comet.publish('/station/' + this._channelName, {
      artist:   track.artist,
      name:     track.name,
      path:     track.path
    });
    this.listen();
  },
  
  receive: function(track) {
    this.play(track);
  },
  
  listen: function(channel) {
    if (this._currentStation)
      this._comet.unsubscribe('/station/' + this._currentStation,
                              this.method('receive'));
    
    if (!channel) return this._currentStation = null;
    
    this._currentStation = channel.channelName;
    this._comet.subscribe('/station/' + this._currentStation,
                          this.method('receive'));
  },
  
  extend: {
    Album: new JS.Class({
      include: JS.Comparable,
      
      initialize: function(hub, artist, name) {
        this._hub   = hub;
        this.artist = artist;
        this.name   = name;
      },
      
      compareTo: function(other) {
        return this.name < other.name ? -1 : (this.name > other.name ? 1 : 0);
      },
      
      equals: function(other) {
        return other instanceof this.klass &&
               this.artist === other.artist &&
               this.name === other.name;
      },
      
      getHTML: function() {
        if (this._html) return this._html;
        var self = this;
        
        this._html = Ojay( Ojay.HTML.li(function(h) {
          var link = Ojay(h.a({href: '#'}, self.name));
          link.on('click', Ojay.stopDefault)._(self._hub).filterByAlbum(self.name);
        }) );
        
        return this._html;
      },
      
      show: function() { this.getHTML().show() },
      hide: function() { this.getHTML().hide() }
    }),
    
    Track: new JS.Class({
      include: JS.Comparable,
      
      extend: {
        compareItems: function(one, other, property) {
          var a = one[property], b = other[property];
          return (a === b) ? 0 : (a < b ? -1 : 1);
        }
      },
      
      initialize: function(hub, data) {
        this._hub = hub;
        JS.extend(this, data);
        this.path = hub._libraryAddress + data.path;
      },
      
      compareTo: function(other) {
        var c = this.klass.compareItems;
        return c(this, other, 'artist') ||
               c(this, other, 'album') ||
               c(this, other, 'trackNo');
      },
      
      getHTML: function() {
        if (this._html) return this._html;
        var self = this;
        
        this._html = Ojay( Ojay.HTML.tr(function(h) {
          h.td({className: 'artist'}, self.artist);
          h.td({className: 'album'}, self.album);
          h.td({className: 'track'}, String(self.trackNo));
          h.td({className: 'name'}, function(h) {
            var link = Ojay( h.a({href: '#'}, self.name) );
            link.on('click', Ojay.stopDefault)._(self._hub).broadcast(self);
          });
        }) );
        
        return this._html;
      },
      
      show: function() { this.getHTML().show() },
      hide: function() { this.getHTML().hide() }
    }),
    
    Channel: new JS.Class({
      include: JS.Comparable,
      
      initialize: function(hub, config) {
        this._hub = hub;
        JS.extend(this, config);
      },
      
      compareTo: function(other) {
        var a = this.displayName, b = other.displayName;
        return a < b ? -1 : (a > b ? 1 : 0);
      },
      
      getHTML: function() {
        if (this._html) return this._html;
        var self = this;
        
        this._html = Ojay.HTML.li(function(h) {
          var link = Ojay( h.a({href: '#'}, self.displayName) );
          link.on('click', Ojay.stopDefault)._(self._hub).listen(self);
        });
        
        return this._html;
      }
    })
  }
});
