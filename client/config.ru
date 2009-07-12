require 'rubygems'
require 'rack'
require 'faye'
require File.dirname(__FILE__) + '/app'

use Faye::Proxy, :mount => '/comet'
run Sinatra::Application
